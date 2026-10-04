import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.js";
import { ok } from "../utils/http.js";
export const searchRouter = Router();
function excerpt(text, term) {
  if (!text) return "";
  const index = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  const start = Math.max(0, index - 45);
  return `${start ? "…" : ""}${text.slice(start, start + 180)}${text.length > start + 180 ? "…" : ""}`;
}
searchRouter.get("/", async (req, res) => {
  const term = z.string().trim().min(2).max(200).parse(req.query.q);
  const match = { contains: term, mode: "insensitive" },
    userId = req.user.id;
  const groups = [
    [
      "Workspaces",
      "workspace",
      "workspace",
      { userId, OR: [{ name: match }, { description: match }] },
      { id: true, name: true, description: true },
      (r) => ({
        title: r.name,
        text: r.description,
        url: `/app/workspaces/${r.id}`,
      }),
    ],
    [
      "Documents",
      "document",
      "document",
      {
        userId,
        OR: [
          { originalName: match },
          { status: "READY", chunks: { some: { content: match } } },
        ],
      },
      {
        id: true,
        originalName: true,
        chunks: {
          where: { content: match, document: { status: "READY" } },
          take: 1,
          select: { content: true, id: true, pageNumber: true },
        },
      },
      (r) => ({
        title: r.originalName,
        text: r.chunks[0]?.content,
        url: `/app/documents/${r.id}${r.chunks[0] ? `?chunk=${r.chunks[0].id}${r.chunks[0].pageNumber ? `&page=${r.chunks[0].pageNumber}` : ""}` : ""}`,
      }),
    ],
    [
      "Conversations",
      "conversation",
      "conversation",
      {
        userId,
        OR: [{ title: match }, { messages: { some: { content: match } } }],
      },
      {
        id: true,
        title: true,
        messages: {
          where: { content: match },
          take: 1,
          select: { content: true },
        },
      },
      (r) => ({
        title: r.title,
        text: r.messages[0]?.content,
        url: `/app/agent/${r.id}`,
      }),
    ],
    [
      "Summaries & notes",
      "summary",
      "summary",
      { userId, OR: [{ title: match }, { content: match }] },
      { id: true, title: true, content: true, kind: true },
      (r) => ({
        title: r.title,
        text: r.content,
        url: `/app/study/${r.kind === "NOTES" ? "notes" : "summaries"}/${r.id}`,
      }),
    ],
    [
      "Quizzes",
      "quiz",
      "quiz",
      { userId, title: match },
      { id: true, title: true },
      (r) => ({ title: r.title, url: `/app/study/quizzes/${r.id}` }),
    ],
    [
      "Flashcard decks",
      "deck",
      "flashcardDeck",
      { userId, title: match },
      { id: true, title: true },
      (r) => ({ title: r.title, url: `/app/study/flashcards/${r.id}` }),
    ],
  ];
  const results = await Promise.all(
    groups.map(async ([label, type, model, where, select, map]) => {
      const [rows, total] = await Promise.all([
        db[model].findMany({
          where,
          select,
          take: 8,
          orderBy: { updatedAt: "desc" },
        }),
        db[model].count({ where }),
      ]);
      return {
        label,
        total,
        items: rows.map((r) => {
          const item = map(r);
          return {
            id: r.id,
            type,
            title: item.title,
            excerpt: excerpt(item.text, term),
            url: item.url,
          };
        }),
      };
    }),
  );
  ok(res, {
    query: term,
    groups: results,
    total: results.reduce((sum, group) => sum + group.total, 0),
  });
});
