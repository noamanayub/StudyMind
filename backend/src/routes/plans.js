import { Router } from "express";
import { db } from "../config/database.js";
import { owned } from "../services/ownership.js";
import { id, titleInput } from "../validators/index.js";
import { planInput, taskInput } from "../validators/routines.js";
import { planTasks } from "../services/schedule.js";
import { calendarForPlan } from "../services/calendar.js";
import { ok, pagination, ApiError } from "../utils/http.js";
export const planRouter = Router();
planRouter.get("/", async (req, res) => {
  const { skip, take, page, limit } = pagination(req.query),
    where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    db.studyPlan.findMany({
      where,
      skip,
      take,
      orderBy: { examDate: "asc" },
      include: { tasks: { orderBy: { date: "asc" } } },
    }),
    db.studyPlan.count({ where }),
  ]);
  ok(res, { items, total, page, limit });
});
planRouter.post("/", async (req, res) => {
  const input = planInput.parse(req.body),
    materials = [];
  const models = {
    DOCUMENT: "document",
    QUIZ: "quiz",
    FLASHCARDS: "flashcardDeck",
    NOTES: "summary",
  };
  for (const selected of input.materials) {
    const material = await owned(
      models[selected.kind],
      selected.id,
      req.user.id,
    );
    if (
      (selected.kind === "DOCUMENT" && material.status !== "READY") ||
      (selected.kind === "NOTES" && material.kind !== "NOTES")
    )
      throw new ApiError(
        400,
        "INVALID_MATERIAL",
        "Choose ready study material.",
      );
    materials.push({
      ...selected,
      title: material.title || material.originalName,
    });
  }
  const tasks = planTasks(input, materials);
  if (!tasks)
    throw new ApiError(
      400,
      "INVALID_DATES",
      "Choose an exam 1 to 180 days after your first study day.",
    );
  const { title, examDate, dailyMinutes } = input;
  const plan = await db.studyPlan.create({
    data: {
      userId: req.user.id,
      title,
      examDate: new Date(examDate),
      dailyMinutes,
      tasks: { create: tasks },
    },
    include: { tasks: true },
  });
  ok(res, plan, "Study plan saved.", 201);
});
planRouter.get("/:id/calendar", async (req, res) => {
  const plan = await owned("studyPlan", req.params.id, req.user.id, {
    tasks: { orderBy: { date: "asc" } },
  });
  res
    .set("Content-Type", "text/calendar; charset=utf-8")
    .set("Content-Disposition", 'attachment; filename="study-plan.ics"')
    .set("Cache-Control", "private, no-store")
    .send(calendarForPlan(plan));
});
planRouter.get("/:id", async (req, res) =>
  ok(
    res,
    await owned("studyPlan", req.params.id, req.user.id, {
      tasks: { orderBy: { date: "asc" } },
    }),
  ),
);
planRouter.patch("/:id", async (req, res) => {
  await owned("studyPlan", req.params.id, req.user.id);
  ok(
    res,
    await db.studyPlan.update({
      where: { id: req.params.id },
      data: titleInput.parse(req.body),
    }),
  );
});
planRouter.patch("/:id/tasks/:taskId", async (req, res) => {
  const plan = await owned("studyPlan", req.params.id, req.user.id),
    input = taskInput.parse(req.body);
  const task = await db.studyTask.findFirst({
    where: { id: id.parse(req.params.taskId), planId: plan.id },
  });
  if (!task)
    throw new ApiError(404, "NOT_FOUND", "This task is not available.");
  ok(
    res,
    await db.studyTask.update({
      where: { id: task.id },
      data: { completedAt: input.completed ? new Date() : null },
    }),
  );
});
planRouter.delete("/:id", async (req, res) => {
  await owned("studyPlan", req.params.id, req.user.id);
  await db.studyPlan.delete({ where: { id: req.params.id } });
  ok(res, null, "Study plan deleted.");
});
