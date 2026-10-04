import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.js";
import { password } from "../validators/index.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  cookieOptions,
} from "../services/authService.js";
import { ok, ApiError, publicUser } from "../utils/http.js";
import { preferencesInput } from "../validators/study.js";
export const userRouter = Router();
userRouter.patch("/me/preferences", async (req, res) => {
  const input = preferencesInput.parse(req.body);
  ok(
    res,
    publicUser(
      await db.user.update({ where: { id: req.user.id }, data: input }),
    ),
    "Preferences saved.",
  );
});
userRouter.patch("/me", async (req, res) => {
  const input = z
    .object({
      name: z.string().trim().min(2).max(100),
      avatarUrl: z
        .string()
        .max(200000)
        .nullable()
        .optional()
        .refine(
          (v) =>
            !v ||
            /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
          "Choose a small PNG, JPEG, or WebP image.",
        ),
    })
    .parse(req.body);
  ok(
    res,
    publicUser(
      await db.user.update({ where: { id: req.user.id }, data: input }),
    ),
  );
});
userRouter.patch("/me/password", async (req, res) => {
  const input = z
    .object({
      currentPassword: z.string().max(256),
      password,
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, "Passwords do not match.")
    .parse(req.body);
  if (!(await verifyPassword(input.currentPassword, req.user.passwordHash)))
    throw new ApiError(
      400,
      "WRONG_PASSWORD",
      "Your current password is incorrect.",
    );
  await db.$transaction([
    db.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await hashPassword(input.password) },
    }),
    db.session.deleteMany({ where: { userId: req.user.id } }),
  ]);
  res.clearCookie("study_session", cookieOptions);
  await createSession(req.user.id, false, res);
  ok(res, null, "Password updated. Other sessions have been signed out.");
});
