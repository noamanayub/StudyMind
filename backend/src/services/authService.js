import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
export async function createSession(userId, rememberMe, res) {
  const seconds = rememberMe ? 30 * 86400 : 12 * 3600;
  const session = await db.session.create({
    data: { userId, expiresAt: new Date(Date.now() + seconds * 1000) },
  });
  const token = jwt.sign({ sid: session.id }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: userId,
    issuer: "study-mind",
    audience: "study-mind-web",
    expiresIn: seconds,
  });
  res.cookie("study_session", token, {
    ...cookieOptions,
    ...(rememberMe ? { maxAge: seconds * 1000 } : {}),
  });
}
export const hashPassword = (value) => bcrypt.hash(value, 12);
export const verifyPassword = (value, hash) => bcrypt.compare(value, hash);
