import { Router } from "express";
import { db } from "../config/database.js";
import { owned } from "../services/ownership.js";
import { titleInput } from "../validators/index.js";
import { attemptInput } from "../validators/study.js";
import { ok, pagination, ApiError } from "../utils/http.js";
import { availableSources } from "../services/studyService.js";
import { scoreQuestions } from "../services/quizScoring.js";
export const quizRouter = Router();
quizRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    db.quiz.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        questionCount: true,
        createdAt: true,
        _count: { select: { attempts: true } },
      },
    }),
    db.quiz.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
quizRouter.get("/:id", async (req, res) => {
  const quiz = await owned("quiz", req.params.id, req.user.id);
  const questions = await db.quizQuestion.findMany({
    where: { quizId: quiz.id },
    orderBy: { position: "asc" },
    select: {
      id: true,
      position: true,
      question: true,
      type: true,
      options: true,
    },
  });
  const attempts = await db.quizAttempt.findMany({
    where: { quizId: quiz.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  // Answer keys are released only in a saved, completed attempt.
  ok(
    res,
    await availableSources({ ...quiz, questions, attempts }, req.user.id),
  );
});
quizRouter.patch("/:id", async (req, res) => {
  await owned("quiz", req.params.id, req.user.id);
  ok(
    res,
    await db.quiz.update({
      where: { id: req.params.id },
      data: titleInput.parse(req.body),
    }),
  );
});
quizRouter.delete("/:id", async (req, res) => {
  await owned("quiz", req.params.id, req.user.id);
  await db.quiz.delete({ where: { id: req.params.id } });
  ok(res, null, "Quiz deleted.");
});
quizRouter.post("/:id/attempts", async (req, res) => {
  const quiz = await owned("quiz", req.params.id, req.user.id),
    input = attemptInput.parse(req.body);
  const existing = await db.quizAttempt.findUnique({
    where: {
      quizId_requestId: { quizId: quiz.id, requestId: input.requestId },
    },
  });
  if (existing) return ok(res, existing);
  const questions = await db.quizQuestion.findMany({
    where: { quizId: quiz.id },
    orderBy: { position: "asc" },
  });
  const answers = new Map(input.answers.map((a) => [a.questionId, a.answer]));
  if (
    answers.size !== input.answers.length ||
    answers.size !== questions.length ||
    questions.some((q) => !answers.has(q.id))
  )
    throw new ApiError(
      400,
      "INCOMPLETE_ATTEMPT",
      "Answer each question once before submitting.",
    );
  if (
    questions.some(
      (q) =>
        q.type !== "SHORT_ANSWER" && !q.options.includes(answers.get(q.id)),
    )
  )
    throw new ApiError(
      400,
      "INVALID_ANSWER",
      "Choose one of the listed answers.",
    );
  const results = scoreQuestions(questions, input.answers);
  try {
    const saved = await db.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          requestId: input.requestId,
          score: results.filter((r) => r.correct).length,
          total: questions.length,
          results,
        },
      });
      await tx.studyActivity.create({
        data: {
          userId: req.user.id,
          action: "COMPLETED_QUIZ",
          title: quiz.title,
          resourceId: quiz.id,
        },
      });
      return attempt;
    });
    ok(res, saved, "Quiz scored.", 201);
  } catch (error) {
    if (error.code !== "P2002") throw error;
    ok(
      res,
      await db.quizAttempt.findUnique({
        where: {
          quizId_requestId: { quizId: quiz.id, requestId: input.requestId },
        },
      }),
    );
  }
});
