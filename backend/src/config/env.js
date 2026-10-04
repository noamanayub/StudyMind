import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  AGENT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FRONTEND_URL: z.url().default("http://127.0.0.1:5173"),
  AGENT_API_URL: z.url().default("http://127.0.0.1:8000"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().max(100).default(20),
  UPLOAD_DIR: z.string().default("./uploads"),
});
export const env = schema.parse(process.env);
export const uploadDir = path.resolve(backendRoot, env.UPLOAD_DIR);
