import { Router } from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import { owned } from "../services/ownership.js";
import { id } from "../validators/index.js";
import { ok, ApiError, pagination } from "../utils/http.js";
const input = z
  .object({ query: z.string().trim().min(5).max(2000), requestId: id })
  .strict();
const safeUrl = z.url().refine((v) => {
  const u = new URL(v);
  return (
    u.protocol === "https:" &&
    !u.username &&
    !u.password &&
    !u.port &&
    !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
  );
});
const output = z.object({
  content: z.string().min(1).max(50000),
  sources: z
    .array(z.object({ url: safeUrl, title: z.string().max(2000) }))
    .min(1)
    .max(100),
  supports: z
    .array(
      z.object({
        text: z.string().min(1).max(10000),
        sourceIndices: z.array(z.number().int().min(0)).min(1).max(100),
      }),
    )
    .min(1)
    .max(200),
  suggestionsHtml: z.string().min(1).max(100000),
});
export const researchRouter = Router();
researchRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    db.researchReport.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: { id: true, query: true, createdAt: true },
    }),
    db.researchReport.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
researchRouter.get("/:id", async (req, res) =>
  ok(res, await owned("researchReport", req.params.id, req.user.id)),
);
researchRouter.delete("/:id", async (req, res) => {
  await owned("researchReport", req.params.id, req.user.id);
  await db.researchReport.delete({ where: { id: req.params.id } });
  ok(res, null, "Research report deleted.");
});
researchRouter.post(
  "/",
  rateLimit({
    windowMs: 60000,
    limit: 5,
    keyGenerator: (req) => req.user.id,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Please wait a minute before starting more research.",
      error: { code: "RATE_LIMITED" },
    },
  }),
  async (req, res) => {
    const data = input.parse(req.body),
      where = {
        userId_requestId: { userId: req.user.id, requestId: data.requestId },
      },
      existing = await db.researchReport.findUnique({ where });
    if (existing) return ok(res, existing);
    let result;
    try {
      const response = await axios.post(
        `${env.AGENT_API_URL}/research`,
        { query: data.query },
        {
          headers: { "X-Agent-Secret": env.AGENT_SECRET },
          timeout: 110000,
          maxContentLength: 300000,
        },
      );
      result = output.parse(response.data);
      if (
        result.supports.some((s) =>
          s.sourceIndices.some((i) => i >= result.sources.length),
        )
      )
        throw new Error("Invalid evidence.");
    } catch {
      throw new ApiError(
        503,
        "RESEARCH_UNAVAILABLE",
        "Web research is unavailable or returned incomplete evidence. Please try again shortly.",
      );
    }
    const saved = await db.researchReport.upsert({
      where,
      create: { ...result, ...data, userId: req.user.id },
      update: {},
    });
    ok(res, saved, "Research report saved.", 201);
  },
);
