import { Router } from "express";
import { db } from "../config/database.js";
import { workspaceInput } from "../validators/index.js";
import { owned } from "../services/ownership.js";
import { removeFiles } from "../services/fileService.js";
import { ok, pagination } from "../utils/http.js";
export const workspaceRouter = Router();
workspaceRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query);
  const where = {
    userId: req.user.id,
    ...(req.query.search
      ? {
          name: {
            contains: String(req.query.search).slice(0, 200),
            mode: "insensitive",
          },
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.workspace.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { documents: true, conversations: true } } },
    }),
    db.workspace.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
workspaceRouter.post("/", async (req, res) =>
  ok(
    res,
    await db.workspace.create({
      data: { ...workspaceInput.parse(req.body), userId: req.user.id },
    }),
    "Workspace created.",
    201,
  ),
);
workspaceRouter.get("/:id", async (req, res) =>
  ok(
    res,
    await owned("workspace", req.params.id, req.user.id, {
      _count: { select: { documents: true, conversations: true } },
    }),
  ),
);
workspaceRouter.patch("/:id", async (req, res) => {
  await owned("workspace", req.params.id, req.user.id);
  ok(
    res,
    await db.workspace.update({
      where: { id: req.params.id },
      data: workspaceInput.partial().parse(req.body),
    }),
  );
});
workspaceRouter.delete("/:id", async (req, res) => {
  const workspace = await owned("workspace", req.params.id, req.user.id, {
    documents: { select: { storedName: true } },
  });
  await db.workspace.delete({ where: { id: workspace.id } });
  await removeFiles(workspace.documents.map((d) => d.storedName));
  ok(res, null, "Workspace and its material deleted.");
});
