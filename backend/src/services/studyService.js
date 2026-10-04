import axios from "axios";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";
import { validateScope } from "./ownership.js";
import {
  studyInput,
  contentOutput,
  quizOutput,
  deckOutput,
} from "../validators/study.js";
const pending = new Set();
export async function availableSources(record, userId) {
  const sources = Array.isArray(record.sources) ? record.sources : [];
  const ids = sources.map((s) => s.documentId).filter(Boolean);
  const docs = await db.document.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  const available = new Set(docs.map((d) => d.id));
  return {
    ...record,
    sources: sources.map((s) => ({
      ...s,
      documentId: available.has(s.documentId) ? s.documentId : null,
    })),
  };
}
export async function generateStudy(user, kind, body) {
  const input = studyInput.parse(body);
  const scope = await validateScope(input, user.id);
  const model =
    kind === "QUIZ"
      ? "quiz"
      : kind === "FLASHCARDS"
        ? "flashcardDeck"
        : "summary";
  const findExisting = () =>
    db[model].findFirst({
      where: { userId: user.id, requestId: input.requestId },
      select: { id: true, title: true },
    });
  const existing = await findExisting();
  if (existing) return existing;
  const key = `${user.id}:${input.requestId}`;
  if (pending.has(key))
    throw new ApiError(
      409,
      "GENERATION_BUSY",
      "This resource is still being created.",
    );
  pending.add(key);
  try {
    let response;
    try {
      response = await axios.post(
        `${env.AGENT_API_URL}/study/generate`,
        {
          ...input,
          ...scope,
          userId: user.id,
          kind,
          answerStyle: user.answerStyle,
          explanationLevel: user.explanationLevel,
        },
        { headers: { "X-Agent-Secret": env.AGENT_SECRET }, timeout: 120000 },
      );
    } catch (error) {
      const detail = error.response?.data?.detail;
      throw new ApiError(
        error.response?.status === 422 ? 422 : 503,
        "STUDY_UNAVAILABLE",
        typeof detail === "string" && detail.length < 250
          ? detail
          : "We couldn't create this study resource. Please try again.",
      );
    }
    const parsed = (
      kind === "QUIZ"
        ? quizOutput
        : kind === "FLASHCARDS"
          ? deckOutput
          : contentOutput
    ).safeParse(response.data);
    if (!parsed.success)
      throw new ApiError(
        503,
        "INVALID_GENERATION",
        "The generated resource was incomplete. Please try again.",
      );
    const generated = parsed.data;
    if (generated.coverage.totalChunks < generated.coverage.selectedChunks)
      throw new ApiError(
        503,
        "INVALID_GENERATION",
        "The source coverage could not be verified.",
      );
    if (kind === "QUIZ") {
      const types = new Set(generated.questions.map((q) => q.type));
      if (
        generated.questions.length !== input.questionCount ||
        new Set(generated.questions.map((q) => normalizeAnswer(q.question)))
          .size !== generated.questions.length ||
        (input.questionType === "MIXED"
          ? types.size !== 3
          : [...types].some((t) => t !== input.questionType)) ||
        generated.questions.some((q) =>
          q.type === "SHORT_ANSWER"
            ? q.options.length !== 0
            : !q.options.includes(q.correctAnswer) ||
              (q.type === "TRUE_FALSE"
                ? q.options.join("|") !== "True|False"
                : q.options.length !== 4 || new Set(q.options).size !== 4),
        )
      ) {
        throw new ApiError(
          503,
          "INVALID_GENERATION",
          "The quiz did not match your settings. Please try again.",
        );
      }
    }
    if (
      kind === "FLASHCARDS" &&
      (generated.cards.length !== input.cardCount ||
        new Set(generated.cards.map((c) => normalizeAnswer(c.front))).size !==
          generated.cards.length)
    )
      throw new ApiError(
        503,
        "INVALID_GENERATION",
        "The generated deck was incomplete. Please try again.",
      );
    return await db.$transaction(async (tx) => {
      const chunks = await tx.documentChunk.findMany({
        where: {
          id: { in: generated.sources.map((s) => s.chunkId) },
          document: {
            userId: user.id,
            status: "READY",
            ...(scope.scope === "workspace"
              ? { workspaceId: scope.workspaceId }
              : scope.scope === "documents"
                ? { id: { in: scope.documentIds } }
                : {}),
          },
        },
        select: {
          id: true,
          documentId: true,
          content: true,
          pageNumber: true,
          section: true,
          document: { select: { originalName: true } },
        },
      });
      if (
        generated.sources.some(
          (s) =>
            !chunks.some(
              (c) => c.id === s.chunkId && c.documentId === s.documentId,
            ),
        )
      )
        throw new ApiError(
          503,
          "INVALID_SOURCES",
          "The source material changed. Choose ready documents and try again.",
        );
      const sources = chunks.map((c) => ({
        chunkId: c.id,
        documentId: c.documentId,
        documentName: c.document.originalName,
        contentPreview: c.content.slice(0, 600),
        pageNumber: c.pageNumber,
        section: c.section,
      }));
      if (
        scope.workspaceId &&
        !(await tx.workspace.findFirst({
          where: { id: scope.workspaceId, userId: user.id },
        }))
      )
        throw new ApiError(404, "NOT_FOUND", "This workspace was deleted.");
      const data = {
        userId: user.id,
        workspaceId: scope.workspaceId,
        documentIds: [...new Set(chunks.map((c) => c.documentId))],
        requestId: input.requestId,
        title: generated.title,
        sources,
        coverage: generated.coverage,
      };
      const record = await tx[model].create({
        data: {
          ...data,
          ...(kind === "QUIZ"
            ? {
                difficulty: input.difficulty,
                questionCount: input.questionCount,
                questions: {
                  create: generated.questions.map((q, position) => ({
                    ...q,
                    position,
                  })),
                },
              }
            : kind === "FLASHCARDS"
              ? {
                  cards: {
                    create: generated.cards.map((c, position) => ({
                      ...c,
                      position,
                    })),
                  },
                }
              : { kind, format: input.format, content: generated.content }),
        },
        select: { id: true, title: true },
      });
      await tx.studyActivity.create({
        data: {
          userId: user.id,
          action: `GENERATED_${kind}`,
          title: record.title,
          resourceId: record.id,
        },
      });
      return record;
    });
  } catch (error) {
    if (error.code === "P2002") {
      const saved = await findExisting();
      if (saved) return saved;
    }
    throw error;
  } finally {
    pending.delete(key);
  }
}
export function normalizeAnswer(answer) {
  return answer
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/u, "");
}
