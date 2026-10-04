import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import rateLimit from "express-rate-limit";
import { db } from "../config/database.js";
import { auth } from "../middleware/auth.js";
import { registerInput, loginInput } from "../validators/index.js";
import {
  createSession,
  cookieOptions,
  hashPassword,
  verifyPassword,
} from "../services/authService.js";
import { ok, ApiError, publicUser } from "../utils/http.js";
export const authRouter = Router();
const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
    error: { code: "RATE_LIMITED" },
  },
});
authRouter.post("/register", limit, async (req, res) => {
  const input = registerInput.parse(req.body);
  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
  });
  await createSession(user.id, false, res);
  ok(res, publicUser(user), "Your study space is ready.", 201);
});
authRouter.post("/login", limit, async (req, res) => {
  const input = loginInput.parse(req.body);
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(
    input.password,
    user?.passwordHash ||
      "$2b$12$KIXK3GWipnQFOYwOlS0pj.XEXnGWNo13RfZIb/6EgMLngDBNAIN/q",
  );
  if (!user || !valid) {
    console.warn(JSON.stringify({ event: "authentication_failed" }));
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }
  await createSession(user.id, input.rememberMe, res);
  ok(res, publicUser(user), "Welcome back.");
});
authRouter.get("/me", auth, (req, res) => ok(res, publicUser(req.user)));
authRouter.post("/logout", async (req, res) => {
  const token = req.cookies.study_session;
  let sessionId;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "study-mind",
        audience: "study-mind-web",
      });
      sessionId = payload.sid;
    } catch {
      /* Already expired sessions are safe to clear. */
    }
  }
  if (sessionId) await db.session.deleteMany({ where: { id: sessionId } });
  res.clearCookie("study_session", cookieOptions);
  ok(res, null, "Signed out.");
});
