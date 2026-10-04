import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../config/database.js";
import { scopeInput, titleInput, messageInput } from "../validators/index.js";
import { owned, validateScope } from "../services/ownership.js";
import { sendMessage } from "../services/chatService.js";
import { ok, pagination } from "../utils/http.js";
export const conversationRouter = Router();
conversationRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query);
  const where = {
    userId: req.user.id,
    ...(req.query.search
      ? {
          title: {
            contains: String(req.query.search).slice(0, 200),
            mode: "insensitive",
          },
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.conversation.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        workspace: { select: { name: true } },
      },
    }),
    db.conversation.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
conversationRouter.post("/", async (req, res) => {
  const scope = await validateScope(scopeInput.parse(req.body), req.user.id);
  ok(
    res,
    await db.conversation.create({ data: { ...scope, userId: req.user.id } }),
    "Conversation created.",
    201,
  );
});
conversationRouter.get("/:id", async (req, res) => {
  const conversation = await owned("conversation", req.params.id, req.user.id);
  const { take } = pagination(req.query);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const messages = await db.message.findMany({
    where: {
      conversationId: conversation.id,
      ...(before && !isNaN(before) ? { createdAt: { lt: before } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { sources: true },
  });
  ok(res, {
    ...conversation,
    messages: messages.reverse(),
    hasMore: messages.length === take,
  });
});
conversationRouter.patch("/:id", async (req, res) => {
  await owned("conversation", req.params.id, req.user.id);
  ok(
    res,
    await db.conversation.update({
      where: { id: req.params.id },
      data: titleInput.parse(req.body),
    }),
  );
});
conversationRouter.delete("/:id", async (req, res) => {
  await owned("conversation", req.params.id, req.user.id);
  await db.conversation.delete({ where: { id: req.params.id } });
  ok(res, null, "Conversation deleted.");
});
conversationRouter.post(
  "/:id/messages",
  rateLimit({
    windowMs: 60000,
    limit: 15,
    keyGenerator: (req) => req.user.id,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Take a moment, then ask again.",
      error: { code: "RATE_LIMITED" },
    },
  }),
  async (req, res) => {
    const conversation = await owned(
      "conversation",
      req.params.id,
      req.user.id,
    );
    ok(
      res,
      await sendMessage(
        conversation,
        req.user.id,
        messageInput.parse(req.body),
      ),
    );
  },
);
