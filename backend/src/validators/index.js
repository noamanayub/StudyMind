import { z } from "zod";
export const id = z.uuid();
export const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Password must be at most 72 bytes.",
  );
export const registerInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase().max(254),
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const loginInput = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(256),
  rememberMe: z.boolean().default(false),
});
export const workspaceInput = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default(""),
  icon: z
    .enum(["book", "code", "science", "brain", "globe", "folder"])
    .default("book"),
});
export const titleInput = z.object({
  title: z.string().trim().min(1).max(160),
});
export const scopeInput = z.object({
  scope: z.enum(["all", "workspace", "documents"]).default("all"),
  workspaceId: id.optional(),
  documentIds: z.array(id).max(50).default([]),
});
export const messageInput = z.object({
  content: z.string().trim().min(1).max(8000),
  generalKnowledge: z.boolean().default(false),
  requestId: id,
});
