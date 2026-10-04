import { Router } from "express";
import { db } from "../config/database.js";
import { owned } from "../services/ownership.js";
import { titleInput, id } from "../validators/index.js";
import { cardInput } from "../validators/study.js";
import { ok, pagination, ApiError } from "../utils/http.js";
import { availableSources } from "../services/studyService.js";
import { reviewInput } from "../validators/routines.js";
import { scheduleReview } from "../services/schedule.js";
export const flashcardRouter = Router();
flashcardRouter.get("/due", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = {
      deck: { userId: req.user.id },
      OR: [{ dueAt: null }, { dueAt: { lte: new Date() } }],
    };
  const [items, total] = await Promise.all([
    db.flashcard.findMany({
      where,
      skip,
      take,
      orderBy: [{ dueAt: "asc" }, { position: "asc" }],
      include: { deck: { select: { id: true, title: true } } },
    }),
    db.flashcard.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
flashcardRouter.post("/:id/cards/:cardId/reviews", async (req, res) => {
  const deck = await owned("flashcardDeck", req.params.id, req.user.id),
    cardId = id.parse(req.params.cardId),
    input = reviewInput.parse(req.body);
  const result = await db.$transaction(async (tx) => {
    const locked =
      await tx.$queryRaw`SELECT id FROM flashcards WHERE id=${cardId}::uuid AND deck_id=${deck.id}::uuid FOR UPDATE`;
    if (!locked.length)
      throw new ApiError(404, "NOT_FOUND", "This card is not available.");
    const existing = await tx.flashcardReview.findUnique({
      where: { cardId_requestId: { cardId, requestId: input.requestId } },
    });
    if (existing)
      return {
        review: existing,
        card: await tx.flashcard.findUnique({ where: { id: cardId } }),
      };
    const card = await tx.flashcard.findUnique({ where: { id: cardId } }),
      schedule = scheduleReview(card, input.rating);
    const updated = await tx.flashcard.update({
      where: { id: cardId },
      data: schedule,
    });
    const review = await tx.flashcardReview.create({
      data: {
        cardId,
        requestId: input.requestId,
        rating: input.rating,
        scheduledAt: schedule.dueAt,
      },
    });
    await tx.studyActivity.create({
      data: {
        userId: req.user.id,
        action: "SCHEDULED_REVIEW",
        title: deck.title,
        resourceId: deck.id,
      },
    });
    return { review, card: updated };
  });
  ok(res, result, "Next review scheduled.");
});
flashcardRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    db.flashcardDeck.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { cards: true } },
      },
    }),
    db.flashcardDeck.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
flashcardRouter.get("/:id", async (req, res) =>
  ok(
    res,
    await availableSources(
      await owned("flashcardDeck", req.params.id, req.user.id, {
        cards: { orderBy: { position: "asc" } },
      }),
      req.user.id,
    ),
  ),
);
flashcardRouter.patch("/:id", async (req, res) => {
  await owned("flashcardDeck", req.params.id, req.user.id);
  ok(
    res,
    await db.flashcardDeck.update({
      where: { id: req.params.id },
      data: titleInput.parse(req.body),
    }),
  );
});
flashcardRouter.delete("/:id", async (req, res) => {
  await owned("flashcardDeck", req.params.id, req.user.id);
  await db.flashcardDeck.delete({ where: { id: req.params.id } });
  ok(res, null, "Deck deleted.");
});
flashcardRouter.patch("/:id/cards/:cardId", async (req, res) => {
  const deck = await owned("flashcardDeck", req.params.id, req.user.id),
    input = cardInput.parse(req.body);
  const card = await db.flashcard.findFirst({
    where: { id: id.parse(req.params.cardId), deckId: deck.id },
  });
  if (!card)
    throw new ApiError(404, "NOT_FOUND", "This card is not available.");
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.flashcard.update({
      where: { id: card.id },
      data: input,
    });
    await tx.flashcardDeck.update({
      where: { id: deck.id },
      data: { updatedAt: new Date() },
    });
    if (card.status !== input.status)
      await tx.studyActivity.create({
        data: {
          userId: req.user.id,
          action: "REVIEWED_FLASHCARD",
          title: deck.title,
          resourceId: deck.id,
        },
      });
    return updated;
  });
  ok(res, result, "Review status saved.");
});
