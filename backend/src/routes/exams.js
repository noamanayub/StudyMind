import { Router } from "express";
import { db } from "../config/database.js";
import { owned } from "../services/ownership.js";
import { examInput, examAnswers } from "../validators/routines.js";
import { publicQuestion, scoreQuestions } from "../services/quizScoring.js";
import { ok, ApiError, pagination } from "../utils/http.js";
export const examRouter = Router();
function view(session, quiz) {
  return {
    ...session,
    questions: quiz.questions.map(publicQuestion),
    title: quiz.title,
    serverTime: new Date().toISOString(),
  };
}
examRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    db.examSession.findMany({
      where,
      skip,
      take,
      orderBy: { startedAt: "desc" },
      include: { quiz: { select: { title: true } } },
    }),
    db.examSession.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
examRouter.post("/", async (req, res) => {
  const input = examInput.parse(req.body),
    quiz = await owned("quiz", input.quizId, req.user.id, {
      questions: { orderBy: { position: "asc" } },
    });
  const session = await db.examSession.upsert({
    where: {
      userId_requestId: { userId: req.user.id, requestId: input.requestId },
    },
    create: {
      userId: req.user.id,
      quizId: quiz.id,
      requestId: input.requestId,
      deadline: new Date(Date.now() + input.durationMinutes * 60000),
      total: quiz.questions.length,
    },
    update: {},
  });
  if (session.quizId !== quiz.id)
    throw new ApiError(
      409,
      "REQUEST_CONFLICT",
      "This request already started another exam.",
    );
  ok(res, view(session, quiz), "Exam started.", 201);
});
examRouter.get("/:id", async (req, res) => {
  const session = await owned("examSession", req.params.id, req.user.id, {
    quiz: { include: { questions: { orderBy: { position: "asc" } } } },
  });
  const { quiz, ...data } = session;
  ok(res, view(data, quiz));
});
examRouter.patch("/:id/answers", async (req, res) => {
  const session = await owned("examSession", req.params.id, req.user.id, {
      quiz: { include: { questions: true } },
    }),
    input = examAnswers.parse(req.body);
  const ids = new Set(input.answers.map((a) => a.questionId));
  if (
    ids.size !== input.answers.length ||
    input.answers.some(
      (a) =>
        !session.quiz.questions.some(
          (q) =>
            q.id === a.questionId &&
            (q.type === "SHORT_ANSWER" ||
              !a.answer ||
              q.options.includes(a.answer)),
        ),
    )
  )
    throw new ApiError(
      400,
      "INVALID_ANSWERS",
      "Choose valid answers for this exam.",
    );
  const saved = await db.examSession.updateMany({
    where: { id: session.id, finishedAt: null, deadline: { gt: new Date() } },
    data: { answers: input.answers },
  });
  if (!saved.count)
    throw new ApiError(
      409,
      "EXAM_CLOSED",
      "Time is up or this exam has been submitted. Submit to see your saved answers.",
    );
  ok(res, { saved: true }, "Answers saved.");
});
examRouter.post("/:id/finish", async (req, res) => {
  await owned("examSession", req.params.id, req.user.id);
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM exam_sessions WHERE id=${req.params.id}::uuid FOR UPDATE`;
    const session = await tx.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        quiz: { include: { questions: { orderBy: { position: "asc" } } } },
      },
    });
    if (!session)
      throw new ApiError(404, "NOT_FOUND", "This exam is not available.");
    if (session.finishedAt) {
      const { quiz, ...saved } = session;
      return view(saved, quiz);
    }
    const results = scoreQuestions(session.quiz.questions, session.answers);
    const saved = await tx.examSession.update({
      where: { id: session.id },
      data: {
        finishedAt: new Date(),
        score: results.filter((r) => r.correct).length,
        results,
      },
    });
    await tx.studyActivity.create({
      data: {
        userId: req.user.id,
        action: "COMPLETED_EXAM",
        title: session.quiz.title,
        resourceId: session.id,
      },
    });
    return view(saved, session.quiz);
  });
  ok(res, result, "Exam scored.");
});
