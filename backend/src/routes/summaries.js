import { Router } from "express";
import { db } from "../config/database.js";
import { owned } from "../services/ownership.js";
import { ok, pagination, ApiError } from "../utils/http.js";
import {
  contentEdit,
  noteInput,
  noteShareInput,
} from "../validators/study.js";
import { availableSources } from "../services/studyService.js";
export function contentRouter(kind) {
  const router = Router();
  const getRecord = async (req) => {
    const record = await db.summary.findFirst({
      where: { id: req.params.id, kind },
      include: kind === "NOTES" ? { user: { select: { name: true } } } : undefined,
    });
    if (!record)
      throw new ApiError(404, "NOT_FOUND", "This item is not available.");
    if (record.userId === req.user.id)
      return { ...record, shareRole: "OWNER" };
    if (kind !== "NOTES")
      throw new ApiError(404, "NOT_FOUND", "This item is not available.");
    const share = await db.noteShare.findUnique({
      where: { summaryId_userId: { summaryId: record.id, userId: req.user.id } },
    });
    if (!share)
      throw new ApiError(404, "NOT_FOUND", "This item is not available.");
    return { ...record, shareRole: share.role, sharedBy: record.user.name };
  };
  if (kind === "NOTES") {
    router.get("/shared", async (req, res) => {
      const { page, limit, skip, take } = pagination(req.query);
      const where = {
        shares: { some: { userId: req.user.id } },
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
        db.summary.findMany({
          where: { ...where, kind },
          skip,
          take,
          orderBy: { updatedAt: "desc" },
          include: {
            user: { select: { name: true } },
            shares: { where: { userId: req.user.id }, select: { role: true } },
          },
        }),
        db.summary.count({ where: { ...where, kind } }),
      ]);
      ok(res, {
        items: items.map(({ user, shares, ...item }) => ({
          ...item,
          sharedBy: user.name,
          shareRole: shares[0]?.role,
        })),
        total,
        page,
        limit,
      });
    });
    router.get("/:id/shares", async (req, res) => {
      const note = await owned("summary", req.params.id, req.user.id);
      if (note.kind !== kind)
        throw new ApiError(404, "NOT_FOUND", "This note is not available.");
      const { page, limit, skip, take } = pagination(req.query),
        where = { summaryId: req.params.id };
      const [items, total] = await Promise.all([
        db.noteShare.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        db.noteShare.count({ where }),
      ]);
      ok(res, { items, total, page, limit });
    });
    router.post("/:id/shares", async (req, res) => {
      const note = await owned("summary", req.params.id, req.user.id);
      if (note.kind !== kind)
        throw new ApiError(404, "NOT_FOUND", "This note is not available.");
      const input = noteShareInput.parse(req.body);
      const recipient = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true, name: true, email: true },
      });
      if (!recipient || recipient.id === req.user.id)
        throw new ApiError(404, "RECIPIENT_NOT_FOUND", "Choose another registered Study Mind account.");
      const share = await db.noteShare.upsert({
        where: { summaryId_userId: { summaryId: note.id, userId: recipient.id } },
        create: { summaryId: note.id, userId: recipient.id, role: input.role },
        update: { role: input.role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      ok(res, share, "Note access updated.", 201);
    });
    router.patch("/:id/shares/:shareId", async (req, res) => {
      const note = await owned("summary", req.params.id, req.user.id);
      if (note.kind !== kind)
        throw new ApiError(404, "NOT_FOUND", "This note is not available.");
      const { role } = noteShareInput.pick({ role: true }).parse(req.body);
      const result = await db.noteShare.updateMany({
        where: { id: req.params.shareId, summaryId: req.params.id },
        data: { role },
      });
      if (!result.count)
        throw new ApiError(404, "NOT_FOUND", "This note access was not found.");
      ok(res, await db.noteShare.findUnique({ where: { id: req.params.shareId } }));
    });
    router.delete("/:id/shares/:shareId", async (req, res) => {
      const note = await owned("summary", req.params.id, req.user.id);
      if (note.kind !== kind)
        throw new ApiError(404, "NOT_FOUND", "This note is not available.");
      const result = await db.noteShare.deleteMany({
        where: { id: req.params.shareId, summaryId: req.params.id },
      });
      if (!result.count)
        throw new ApiError(404, "NOT_FOUND", "This note access was not found.");
      ok(res, null, "Note access removed.");
    });
  }
  router.get("/", async (req, res) => {
    const { page, limit, skip, take } = pagination(req.query);
    const where = {
      userId: req.user.id,
      kind,
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
      db.summary.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          kind: true,
          format: true,
          edited: true,
          updatedAt: true,
        },
      }),
      db.summary.count({ where }),
    ]);
    ok(res, { items, total, page, limit });
  });
  if (kind === "NOTES")
    router.post("/", async (req, res) => {
      const input = noteInput.parse(req.body);
      if (input.workspaceId)
        await owned("workspace", input.workspaceId, req.user.id);
      const record = await db.$transaction(async (tx) => {
        const note = await tx.summary.create({
          data: {
            ...input,
            userId: req.user.id,
            kind,
            format: "MANUAL",
            documentIds: [],
            content: input.content,
            edited: true,
          },
        });
        await tx.studyActivity.create({
          data: {
            userId: req.user.id,
            action: "SAVED_NOTE",
            title: note.title,
            resourceId: note.id,
          },
        });
        return note;
      });
      ok(res, record, "Note saved.", 201);
    });
  router.get("/:id", async (req, res) =>
    ok(res, await availableSources(await getRecord(req), req.user.id)),
  );
  router.patch("/:id", async (req, res) => {
    const record = await getRecord(req),
      input = contentEdit.parse(req.body);
    if (record.shareRole === "VIEWER")
      throw new ApiError(403, "READ_ONLY", "You have view access to this note.");
    const result = await db.summary.updateMany({
      where: {
        id: record.id,
        kind,
        ...(record.shareRole === "OWNER"
          ? { userId: req.user.id }
          : { shares: { some: { userId: req.user.id, role: "EDITOR" } } }),
      },
      data: {
        ...input,
        ...(input.content !== undefined ? { edited: true } : {}),
      },
    });
    if (!result.count)
      throw new ApiError(403, "ACCESS_REVOKED", "Your access to this note changed. Reload and try again.");
    ok(
      res,
      await availableSources(await db.summary.findUnique({ where: { id: record.id } }), req.user.id),
    );
  });
  router.delete("/:id", async (req, res) => {
    const record = await getRecord(req);
    if (record.shareRole !== "OWNER")
      throw new ApiError(404, "NOT_FOUND", "This item is not available.");
    await db.summary.delete({ where: { id: record.id } });
    ok(res, null, "Study resource deleted.");
  });
  return router;
}
