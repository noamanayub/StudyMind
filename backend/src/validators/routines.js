import { z } from "zod";
import { id } from "./index.js";
export const reviewInput = z
  .object({ requestId: id, rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]) })
  .strict();
export const planInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Choose a valid date.",
      ),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v,
        "Choose a valid date.",
      ),
    dailyMinutes: z.number().int().min(10).max(180),
    materials: z
      .array(
        z.object({
          kind: z.enum(["DOCUMENT", "QUIZ", "FLASHCARDS", "NOTES"]),
          id,
        }),
      )
      .min(1)
      .max(30),
  })
  .strict();
export const taskInput = z.object({ completed: z.boolean() }).strict();
export const examInput = z
  .object({
    quizId: id,
    requestId: id,
    durationMinutes: z.number().int().min(1).max(180),
  })
  .strict();
export const examAnswers = z
  .object({
    answers: z
      .array(z.object({ questionId: id, answer: z.string().trim().max(1000) }))
      .max(20),
  })
  .strict();
