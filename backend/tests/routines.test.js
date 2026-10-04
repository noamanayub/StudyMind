import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { scheduleReview, planTasks } from "../src/services/schedule.js";
import { calendarForPlan } from "../src/services/calendar.js";
let app, db, alice, bob, user, other, quiz, deck, note, plan;
const origin = process.env.FRONTEND_URL;
const mutate = (client, method, path, body) =>
  client[method](`/api/v1${path}`).set("Origin", origin).send(body);
before(async () => {
  assert.ok(
    new URL(process.env.DATABASE_URL).pathname.startsWith("/study_mind_test_"),
  );
  ({ app } = await import("../src/app.js"));
  ({ db } = await import("../src/config/database.js"));
  alice = request.agent(app);
  bob = request.agent(app);
  for (const [client, name] of [
    [alice, "Routine Alice"],
    [bob, "Routine Bob"],
  ]) {
    const password = "Routine-test-password-39!";
    await mutate(client, "post", "/auth/register", {
      name,
      email: `${randomUUID()}@example.test`,
      password,
      confirmPassword: password,
    }).expect(201);
  }
  user = (await alice.get("/api/v1/auth/me").expect(200)).body.data;
  other = (await bob.get("/api/v1/auth/me").expect(200)).body.data;
  note = await db.summary.create({
    data: {
      userId: user.id,
      title: "Revision notes",
      kind: "NOTES",
      format: "MANUAL",
      content: "Source material",
      documentIds: [],
    },
  });
  deck = await db.flashcardDeck.create({
    data: {
      userId: user.id,
      requestId: randomUUID(),
      documentIds: [],
      title: "Revision deck",
      cards: { create: [{ position: 0, front: "Term?", back: "Definition." }] },
    },
    include: { cards: true },
  });
  quiz = await db.quiz.create({
    data: {
      userId: user.id,
      requestId: randomUUID(),
      documentIds: [],
      title: "Practice quiz",
      difficulty: "EASY",
      questionCount: 5,
      questions: {
        create: Array.from({ length: 5 }, (_, i) => ({
          position: i,
          question: `Question ${i}`,
          type: "TRUE_FALSE",
          options: ["True", "False"],
          correctAnswer: "True",
          explanation: "Evidence.",
        })),
      },
    },
    include: { questions: true },
  });
});
after(async () => {
  if (db) {
    await db.user.deleteMany({
      where: { id: { in: [user?.id, other?.id].filter(Boolean) } },
    });
    await db.$disconnect();
  }
});
test("review schedules grow with recall and restart after a lapse", () => {
  const now = new Date("2026-10-03T12:00:00Z"),
    card = { ease: 2.5, intervalDays: 0, repetitions: 0 };
  const first = scheduleReview(card, "GOOD", now),
    second = scheduleReview(first, "GOOD", now),
    third = scheduleReview(second, "GOOD", now);
  assert.equal(first.intervalDays, 1);
  assert.equal(second.intervalDays, 3);
  assert.equal(third.intervalDays, 8);
  const lapse = scheduleReview(third, "AGAIN", now);
  assert.equal(lapse.repetitions, 0);
  assert.equal(lapse.dueAt - now, 600000);
  assert.equal(scheduleReview({ ...card, ease: 1.3 }, "HARD", now).ease, 1.3);
  assert.equal(
    scheduleReview({ ...card, intervalDays: 3600, repetitions: 8 }, "EASY", now)
      .intervalDays,
    3650,
  );
});
test("due reviews persist, are idempotent under concurrency, and enforce ownership", async () => {
  const card = deck.cards[0],
    path = `/flashcards/${deck.id}/cards/${card.id}/reviews`,
    input = { rating: "GOOD", requestId: randomUUID() };
  await mutate(bob, "post", path, input).expect(404);
  const results = await Promise.all([
    mutate(alice, "post", path, input),
    mutate(alice, "post", path, input),
  ]);
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(results[0].body.data.review.id, results[1].body.data.review.id);
  assert.equal(
    await db.flashcardReview.count({ where: { cardId: card.id } }),
    1,
  );
  assert.equal(
    (await db.flashcard.findUnique({ where: { id: card.id } })).repetitions,
    1,
  );
  assert.equal((await alice.get("/api/v1/flashcards/due")).body.data.total, 0);
  await db.flashcard.update({
    where: { id: card.id },
    data: { dueAt: new Date(Date.now() - 1000) },
  });
  assert.equal((await alice.get("/api/v1/flashcards/due")).body.data.total, 1);
  assert.equal((await bob.get("/api/v1/flashcards/due")).body.data.total, 0);
});
test("plans rotate real owned material, validate dates, and persist completion", async () => {
  const input = {
    title: "Exam revision",
    startDate: "2026-10-03",
    examDate: "2026-10-06",
    dailyMinutes: 30,
    materials: [
      { kind: "NOTES", id: note.id },
      { kind: "QUIZ", id: quiz.id },
    ],
  };
  await mutate(bob, "post", "/plans", input).expect(404);
  await mutate(alice, "post", "/plans", {
    ...input,
    examDate: "2026-10-03",
  }).expect(400);
  await mutate(alice, "post", "/plans", {
    ...input,
    startDate: "2026-02-30",
  }).expect(400);
  plan = (await mutate(alice, "post", "/plans", input).expect(201)).body.data;
  assert.equal(plan.tasks.length, 3);
  assert.deepEqual(
    plan.tasks.map((t) => t.kind),
    ["NOTES", "QUIZ", "NOTES"],
  );
  assert.equal(planTasks({ ...input, examDate: "2027-10-03" }, []), null);
  const path = `/plans/${plan.id}/tasks/${plan.tasks[0].id}`;
  await mutate(bob, "patch", path, { completed: true }).expect(404);
  await mutate(alice, "patch", path, { completed: true }).expect(200);
  assert.ok(
    (await alice.get(`/api/v1/plans/${plan.id}`)).body.data.tasks[0]
      .completedAt,
  );
  await mutate(alice, "patch", path, { completed: false }).expect(200);
  assert.equal(
    (await alice.get(`/api/v1/plans/${plan.id}`)).body.data.tasks[0]
      .completedAt,
    null,
  );
});
test("calendar export is owned, date-safe and folds UTF-8 without header injection", async () => {
  await bob.get(`/api/v1/plans/${plan.id}/calendar`).expect(404);
  const exported = await alice
    .get(`/api/v1/plans/${plan.id}/calendar`)
    .expect(200);
  assert.match(exported.headers["content-type"], /text\/calendar/);
  assert.match(exported.text, /DTSTART;VALUE=DATE:20261003/);
  const ics = calendarForPlan({
    ...plan,
    title: "Title\nBEGIN:INJECT",
    tasks: [
      {
        ...plan.tasks[0],
        title: "Study " + "学".repeat(90) + "\nBEGIN:INJECT",
      },
    ],
  });
  assert.ok(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
  assert.ok(!ics.includes("\r\nBEGIN:INJECT"));
  assert.match(ics, /\\nBEGIN:INJECT/);
});
test("timed exams hide keys, restore drafts, score only saved answers, and finish once", async () => {
  const input = {
    quizId: quiz.id,
    requestId: randomUUID(),
    durationMinutes: 5,
  };
  await mutate(bob, "post", "/exams", input).expect(404);
  const exam = (await mutate(alice, "post", "/exams", input).expect(201)).body
    .data;
  assert.equal(
    (await mutate(alice, "post", "/exams", input)).body.data.id,
    exam.id,
  );
  assert.ok(
    exam.questions.every(
      (q) => !("correctAnswer" in q) && !("explanation" in q),
    ),
  );
  assert.equal(exam.results, null);
  await bob.get(`/api/v1/exams/${exam.id}`).expect(404);
  const answer = {
    answers: [{ questionId: quiz.questions[0].id, answer: "True" }],
  };
  await mutate(alice, "patch", `/exams/${exam.id}/answers`, {
    answers: [...answer.answers, ...answer.answers],
  }).expect(400);
  await mutate(alice, "patch", `/exams/${exam.id}/answers`, answer).expect(200);
  assert.deepEqual(
    (await alice.get(`/api/v1/exams/${exam.id}`)).body.data.answers,
    answer.answers,
  );
  const results = await Promise.all([
    mutate(alice, "post", `/exams/${exam.id}/finish`, {}),
    mutate(alice, "post", `/exams/${exam.id}/finish`, {}),
  ]);
  assert.ok(results.every((r) => r.status === 200 && r.body.data.score === 1));
  assert.equal(results[0].body.data.results.length, 5);
  assert.equal(
    await db.studyActivity.count({ where: { resourceId: exam.id } }),
    1,
  );
  await mutate(alice, "patch", `/exams/${exam.id}/answers`, answer).expect(409);
});
test("expired exam rejects late answers and remains resumable for scoring", async () => {
  const exam = (
    await mutate(alice, "post", "/exams", {
      quizId: quiz.id,
      requestId: randomUUID(),
      durationMinutes: 1,
    })
  ).body.data;
  await db.examSession.update({
    where: { id: exam.id },
    data: { deadline: new Date(Date.now() - 1000) },
  });
  await mutate(alice, "patch", `/exams/${exam.id}/answers`, {
    answers: [{ questionId: quiz.questions[0].id, answer: "True" }],
  }).expect(409);
  const result = (await mutate(alice, "post", `/exams/${exam.id}/finish`, {}))
    .body.data;
  assert.equal(result.score, 0);
  assert.equal(result.total, 5);
});
test("deleting plans and decks removes only their children", async () => {
  await mutate(bob, "delete", `/plans/${plan.id}`, {}).expect(404);
  await mutate(alice, "delete", `/plans/${plan.id}`, {}).expect(200);
  assert.equal(await db.studyTask.count({ where: { planId: plan.id } }), 0);
  assert.ok(await db.summary.findUnique({ where: { id: note.id } }));
  await mutate(alice, "delete", `/flashcards/${deck.id}`, {}).expect(200);
  assert.equal(
    await db.flashcardReview.count({ where: { cardId: deck.cards[0].id } }),
    0,
  );
});
