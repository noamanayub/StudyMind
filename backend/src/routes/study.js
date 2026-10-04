import { Router } from "express";
import rateLimit from "express-rate-limit";
import { generateStudy } from "../services/studyService.js";
import { ok } from "../utils/http.js";
export const studyRouter = Router();
studyRouter.use(
  rateLimit({
    windowMs: 60000,
    limit: 6,
    keyGenerator: (req) => req.user.id,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Give your study resources a moment, then try again.",
      error: { code: "RATE_LIMITED" },
    },
  }),
);
for (const [route, kind] of [
  ["summarize", "SUMMARY"],
  ["notes", "NOTES"],
  ["quiz", "QUIZ"],
  ["flashcards", "FLASHCARDS"],
]) {
  studyRouter.post(`/${route}`, async (req, res) =>
    ok(
      res,
      await generateStudy(req.user, kind, req.body),
      "Study resource saved.",
      201,
    ),
  );
}
