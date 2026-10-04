import { Router } from "express";
import { db } from "../config/database.js";
import { ok } from "../utils/http.js";
export const statisticsRouter = Router();
statisticsRouter.get("/", async (req, res) => {
  const userId = req.user.id;
  const [
    documents,
    workspaces,
    questions,
    flashcards,
    knownCards,
    summaries,
    notes,
    quizzes,
    attempts,
    activities,
  ] = await Promise.all([
    db.document.count({ where: { userId } }),
    db.workspace.count({ where: { userId } }),
    db.message.count({ where: { role: "USER", conversation: { userId } } }),
    db.flashcard.count({ where: { deck: { userId } } }),
    db.flashcard.count({ where: { status: "KNOWN", deck: { userId } } }),
    db.summary.count({ where: { userId, kind: "SUMMARY" } }),
    db.summary.count({ where: { userId, kind: "NOTES" } }),
    db.quiz.count({ where: { userId } }),
    db.quizAttempt.count({ where: { quiz: { userId } } }),
    db.studyActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, title: true, createdAt: true },
    }),
  ]);
  ok(res, {
    documents,
    workspaces,
    questions,
    flashcards,
    knownCards,
    summaries,
    notes,
    quizzes,
    attempts,
    activities,
  });
});
