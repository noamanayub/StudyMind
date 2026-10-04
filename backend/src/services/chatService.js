import axios from "axios";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";
const inFlight = new Set();
export async function sendMessage(conversation, userId, input) {
  const existing = await db.message.findFirst({
    where: {
      conversationId: conversation.id,
      requestId: input.requestId,
      role: "ASSISTANT",
    },
    include: { sources: true },
  });
  if (existing) return existing;
  if (inFlight.has(conversation.id))
    throw new ApiError(409, "CHAT_BUSY", "Please wait for the current answer.");
  inFlight.add(conversation.id);
  try {
    const preferences = await db.user.findUnique({
      where: { id: userId },
      select: { answerStyle: true, explanationLevel: true },
    });
    const history = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    let response;
    try {
      response = await axios.post(
        `${env.AGENT_API_URL}/chat`,
        {
          userId,
          conversationId: conversation.id,
          scope: conversation.scope,
          workspaceId: conversation.workspaceId,
          documentIds: conversation.documentIds,
          question: input.content,
          generalKnowledge: input.generalKnowledge,
          ...preferences,
          history: history
            .reverse()
            .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })),
        },
        { headers: { "X-Agent-Secret": env.AGENT_SECRET }, timeout: 120000 },
      );
    } catch (error) {
      const detail = error.response?.data?.detail;
      throw new ApiError(
        503,
        "AGENT_UNAVAILABLE",
        typeof detail === "string" && detail.length < 250
          ? detail
          : "Study Mind could not answer right now. Please try again.",
      );
    }
    const answer = response.data;
    return await db.$transaction(async (tx) => {
      const stillOwned = await tx.conversation.findFirst({
        where: { id: conversation.id, userId },
      });
      if (!stillOwned)
        throw new ApiError(404, "NOT_FOUND", "This conversation was deleted.");
      const sources = Array.isArray(answer.sources) ? answer.sources : [];
      const documentIds = [...new Set(sources.map((s) => s.documentId))];
      const documents = await tx.document.findMany({
        where: { id: { in: documentIds }, userId, status: "READY" },
        select: { id: true },
      });
      const allowed = new Set(documents.map((d) => d.id));
      const userCreatedAt = new Date();
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: input.content,
          requestId: input.requestId,
          createdAt: userCreatedAt,
        },
      });
      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: answer.answer,
          generalKnowledge: input.generalKnowledge,
          insufficientEvidence: !!answer.insufficientEvidence,
          requestId: input.requestId,
          createdAt: new Date(userCreatedAt.getTime() + 1),
          sources: {
            create: sources
              .filter((s) => allowed.has(s.documentId))
              .map((s) => ({
                documentId: s.documentId,
                documentName: s.documentName,
                pageNumber: s.pageNumber,
                section: s.section,
                chunkId: s.chunkId,
                contentPreview: s.contentPreview,
                similarityScore: s.similarityScore,
              })),
          },
        },
        include: { sources: true },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date(),
          ...(history.length === 0
            ? { title: input.content.slice(0, 80) }
            : {}),
        },
      });
      return message;
    });
  } finally {
    inFlight.delete(conversation.id);
  }
}
