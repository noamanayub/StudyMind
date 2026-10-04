import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { db } from "./config/database.js";
import { auth, originGuard } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { workspaceRouter } from "./routes/workspaces.js";
import { documentRouter } from "./routes/documents.js";
import { conversationRouter } from "./routes/conversations.js";
import { userRouter } from "./routes/users.js";
import { studyRouter } from "./routes/study.js";
import { contentRouter } from "./routes/summaries.js";
import { quizRouter } from "./routes/quizzes.js";
import { flashcardRouter } from "./routes/flashcards.js";
import { searchRouter } from "./routes/search.js";
import { statisticsRouter } from "./routes/statistics.js";
import { planRouter } from "./routes/plans.js";
import { examRouter } from "./routes/exams.js";
import { researchRouter } from "./routes/research.js";
import { ok, ApiError } from "./utils/http.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(originGuard);
app.get("/api/v1/health", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  ok(res, { status: "ok" });
});
app.use("/api/v1/auth", authRouter);
app.get("/api/v1/config", auth, (_req, res) =>
  ok(res, { maxFileSizeMb: env.MAX_FILE_SIZE_MB }),
);
app.use("/api/v1/workspaces", auth, workspaceRouter);
app.use("/api/v1/documents", auth, documentRouter);
app.use("/api/v1/conversations", auth, conversationRouter);
app.use("/api/v1/users", auth, userRouter);
app.use("/api/v1/study", auth, studyRouter);
app.use("/api/v1/summaries", auth, contentRouter("SUMMARY"));
app.use("/api/v1/notes", auth, contentRouter("NOTES"));
app.use("/api/v1/quizzes", auth, quizRouter);
app.use("/api/v1/flashcards", auth, flashcardRouter);
app.use("/api/v1/search", auth, searchRouter);
app.use("/api/v1/statistics", auth, statisticsRouter);
app.use("/api/v1/plans", auth, planRouter);
app.use("/api/v1/exams", auth, examRouter);
app.use("/api/v1/research", auth, researchRouter);
app.use((_req, _res, next) =>
  next(new ApiError(404, "NOT_FOUND", "This endpoint does not exist.")),
);
app.use(errorHandler);
