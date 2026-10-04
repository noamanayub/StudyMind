import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import { id } from "../validators/index.js";
import { owned } from "../services/ownership.js";
import {
  saveDocument,
  removeFiles,
  filePath,
  saveYoutubeReference,
} from "../services/fileService.js";
import { ok, pagination, ApiError } from "../utils/http.js";
import { youtubeReference } from "../services/youtube.js";
export const documentRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1, fields: 2 },
});
documentRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query);
  const where = {
    userId: req.user.id,
    ...(req.query.workspaceId
      ? { workspaceId: id.parse(req.query.workspaceId) }
      : {}),
    ...(req.query.search
      ? {
          originalName: {
            contains: String(req.query.search).slice(0, 200),
            mode: "insensitive",
          },
        }
      : {}),
    ...(req.query.ready === "true" ? { status: "READY" } : {}),
  };
  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: req.query.sort === "oldest" ? "asc" : "desc" },
      include: { workspace: { select: { name: true } } },
    }),
    db.document.count({ where }),
  ]);
  ok(res, {
    items: items.map(({ storedName: _storedName, ...item }) => item),
    total,
    page,
    limit,
  });
});
documentRouter.post("/upload", upload.single("file"), async (req, res) => {
  const workspaceId = id.parse(req.body.workspaceId);
  const mode = z
    .enum(["TEXT", "VISION"])
    .default("TEXT")
    .parse(req.body.extractionMode);
  if (mode === "VISION" && !req.file?.mimetype.startsWith("image/"))
    throw new ApiError(400, "INVALID_MODE", "Visual analysis needs an image.");
  await owned("workspace", workspaceId, req.user.id);
  const file = await saveDocument(req.file);
  try {
    const document = await db.document.create({
      data: {
        ...file,
        extractionMode: file.mimeType.startsWith("audio/") ? "AUDIO" : mode,
        workspaceId,
        userId: req.user.id,
        job: { create: {} },
      },
    });
    await db.workspace.update({
      where: { id: workspaceId },
      data: { updatedAt: new Date() },
    });
    const { storedName: _storedName, ...safe } = document;
    ok(res, safe, "Document uploaded. Processing will start shortly.", 201);
  } catch (error) {
    await removeFiles([file.storedName]);
    throw error;
  }
});
documentRouter.post("/youtube", async (req, res) => {
  const input = z
    .object({
      workspaceId: id,
      title: z.string().trim().min(1).max(200),
      url: z.string().max(500),
    })
    .strict()
    .parse(req.body);
  await owned("workspace", input.workspaceId, req.user.id);
  const reference = youtubeReference(input.url),
    file = await saveYoutubeReference(reference, input.title);
  try {
    const document = await db.document.create({
      data: {
        ...file,
        userId: req.user.id,
        workspaceId: input.workspaceId,
        job: { create: {} },
      },
    });
    const { storedName: _storedName, ...safe } = document;
    ok(res, safe, "Lecture queued for transcription.", 201);
  } catch (error) {
    await removeFiles([file.storedName]);
    throw error;
  }
});
documentRouter.get("/:id/content", async (req, res) => {
  const doc = await owned("document", req.params.id, req.user.id);
  res.set("Cache-Control", "private, no-store");
  res.type(doc.mimeType);
  res.set(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
  );
  res.sendFile(filePath(doc.storedName));
});
documentRouter.get("/:id", async (req, res) => {
  const { storedName: _storedName, ...doc } = await owned(
    "document",
    req.params.id,
    req.user.id,
    { workspace: { select: { name: true } } },
  );
  const chunks =
    doc.status === "READY"
      ? await db.documentChunk.findMany({
          where: { documentId: doc.id },
          select: {
            id: true,
            chunkIndex: true,
            pageNumber: true,
            section: true,
            content: true,
          },
          orderBy: { chunkIndex: "asc" },
          take: 500,
        })
      : [];
  ok(res, { ...doc, chunks });
});
documentRouter.patch("/:id", async (req, res) => {
  await owned("document", req.params.id, req.user.id);
  const { name } = z
    .object({ name: z.string().trim().min(1).max(200) })
    .parse(req.body);
  const doc = await db.document.update({
    where: { id: req.params.id },
    data: { originalName: name },
  });
  const { storedName: _storedName, ...safe } = doc;
  ok(res, safe);
});
documentRouter.post("/:id/reprocess", async (req, res) => {
  const doc = await owned("document", req.params.id, req.user.id);
  if (doc.status !== "FAILED")
    throw new ApiError(
      409,
      "NOT_FAILED",
      "Only failed documents can be retried.",
    );
  await db.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: doc.id },
      data: { status: "PROCESSING", errorMessage: null },
    });
    await tx.processingJob.upsert({
      where: { documentId: doc.id },
      create: { documentId: doc.id },
      update: {
        state: "PENDING",
        attempts: 0,
        availableAt: new Date(),
        lockedAt: null,
        lockToken: null,
        lastError: null,
      },
    });
  });
  ok(res, null, "Processing restarted.");
});
documentRouter.delete("/:id", async (req, res) => {
  const doc = await owned("document", req.params.id, req.user.id);
  await db.document.delete({ where: { id: doc.id } });
  await removeFiles([doc.storedName]);
  ok(res, null, "Document deleted.");
});
