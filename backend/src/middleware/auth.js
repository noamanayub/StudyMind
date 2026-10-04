import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../config/database.js";
import { ApiError } from "../utils/http.js";
export async function auth(req, _res, next) {
  try {
    const token = req.cookies.study_session;
    if (!token) throw new Error("missing");
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "study-mind",
      audience: "study-mind-web",
    });
    const session = await db.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt < new Date()
    )
      throw new Error("expired");
    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    if (error.code?.startsWith("P")) return next(error);
    next(new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
  }
}
export function originGuard(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("origin") !== env.FRONTEND_URL)
    return next(
      new ApiError(
        403,
        "INVALID_ORIGIN",
        "This request origin is not allowed.",
      ),
    );
  next();
}
