import { z } from "zod";
import { scopeInput, id } from "./index.js";
export const studyInput = scopeInput.extend({
  requestId: id,
  format: z
    .enum(["QUICK", "DETAILED", "KEY_POINTS", "EXAM_REVISION"])
    .default("QUICK"),
  questionType: z
    .enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MIXED"])
    .default("MULTIPLE_CHOICE"),
  questionCount: z
    .union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)])
    .default(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  cardCount: z
    .union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)])
    .default(10),
});
const title = z.string().trim().min(1).max(160);
const content = z.string().trim().min(1).max(50000);
export const noteInput = z.object({
  title,
  content,
  workspaceId: id.optional(),
});
export const contentEdit = z
  .object({ title: title.optional(), content: content.optional() })
  .refine(
    (v) => v.title !== undefined || v.content !== undefined,
    "Choose a title or content to update.",
  );
export const noteShareInput = z
  .object({
    email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
    role: z.enum(["VIEWER", "EDITOR"]),
  })
  .strict();
export const preferencesInput = z
  .object({
    answerStyle: z.enum(["SHORT", "BALANCED", "DETAILED"]),
    explanationLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    readingSize: z.enum(["DEFAULT", "LARGE"]),
    density: z.enum(["COMFORTABLE", "COMPACT"]),
    reduceMotion: z.boolean(),
  })
  .strict();
export const attemptInput = z.object({
  requestId: id,
  answers: z
    .array(
      z.object({ questionId: id, answer: z.string().trim().min(1).max(1000) }),
    )
    .min(1)
    .max(20),
});
export const cardInput = z.object({
  status: z.enum(["NEW", "LEARNING", "KNOWN", "REVIEW"]),
});
const source = z.object({ documentId: id, chunkId: id });
const baseOutput = z.object({
  title,
  sources: z.array(source).min(1).max(24),
  coverage: z.object({
    selectedChunks: z.number().int().min(1).max(24),
    totalChunks: z.number().int().positive(),
    documentCount: z.number().int().min(1).max(24),
  }),
});
export const contentOutput = baseOutput.extend({ content });
export const quizOutput = baseOutput.extend({
  questions: z
    .array(
      z.object({
        question: z.string().min(1).max(2000),
        type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
        options: z.array(z.string().min(1).max(1000)).max(4),
        correctAnswer: z.string().min(1).max(1000),
        acceptedAnswers: z
          .array(z.string().min(1).max(1000))
          .max(8)
          .default([]),
        explanation: z.string().min(1).max(3000),
      }),
    )
    .min(5)
    .max(20),
});
export const deckOutput = baseOutput.extend({
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(2000),
        back: z.string().min(1).max(3000),
      }),
    )
    .min(5)
    .max(30),
});
