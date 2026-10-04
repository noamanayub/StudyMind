import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { randomUUID } from "node:crypto";
import request from "supertest";

const ids = [];
const files = [];
let server, app, db, alice, bob, workspace, document, conversation;
let agentFailure = false;
const origin = process.env.FRONTEND_URL;
const password = "StudyMind-test-29!";
const post = (client, path) =>
  client.post(`/api/v1${path}`).set("Origin", origin);
const patch = (client, path) =>
  client.patch(`/api/v1${path}`).set("Origin", origin);
const remove = (client, path) =>
  client.delete(`/api/v1${path}`).set("Origin", origin);
before(async () => {
  assert.ok(new URL(process.env.DATABASE_URL).pathname.startsWith('/study_mind_test_'), 'Use scripts/test.py for isolated database tests.');
  server = http.createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    assert.equal(req.headers["x-agent-secret"], process.env.AGENT_SECRET);
    const input = JSON.parse(body);
    if (agentFailure) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Temporary provider failure." }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        answer: "Normalization organizes data to reduce duplication.",
        insufficientEvidence: false,
        sources: input.generalKnowledge
          ? []
          : [
              {
                documentId: document.id,
                documentName: document.originalName,
                pageNumber: null,
                section: "Section 1",
                chunkId: randomUUID(),
                contentPreview: "Normalization reduces duplication.",
                similarityScore: 0.89,
              },
            ],
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.AGENT_API_URL = `http://127.0.0.1:${server.address().port}`;
  ({ app } = await import("../src/app.js"));
  ({ db } = await import("../src/config/database.js"));
  alice = request.agent(app);
  bob = request.agent(app);
});
after(async () => {
  if (db) {
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
  const { removeFiles } = await import("../src/services/fileService.js");
  await removeFiles(files);
  if (server) await new Promise((resolve) => server.close(resolve));
});
test("registers users, hashes passwords, and sets HttpOnly sessions", async () => {
  for (const [client, name] of [
    [alice, "Alice"],
    [bob, "Bob"],
  ]) {
    const email = `qa-${randomUUID()}@example.test`;
    const response = await post(client, "/auth/register")
      .send({ name, email, password, confirmPassword: password })
      .expect(201);
    ids.push(response.body.data.id);
    assert.equal(response.body.data.passwordHash, undefined);
    assert.match(response.headers["set-cookie"][0], /HttpOnly/);
    const stored = await db.user.findUnique({
      where: { id: response.body.data.id },
    });
    assert.notEqual(stored.passwordHash, password);
  }
});
test("rejects anonymous reads, foreign origins, invalid input and wrong password", async () => {
  await request(app).get("/api/v1/workspaces").expect(401);
  await alice
    .post("/api/v1/workspaces")
    .set("Origin", "https://other.example")
    .send({ name: "Blocked" })
    .expect(403);
  await post(alice, "/workspaces").send({ name: "" }).expect(400);
  await post(request.agent(app), "/auth/login")
    .send({ email: "missing@example.test", password: "wrong" })
    .expect(401);
});
test("creates and isolates workspaces", async () => {
  workspace = (
    await post(alice, "/workspaces")
      .send({
        name: "Database Systems",
        description: "Integration test",
        icon: "code",
      })
      .expect(201)
  ).body.data;
  await bob.get(`/api/v1/workspaces/${workspace.id}`).expect(404);
  await patch(bob, `/workspaces/${workspace.id}`)
    .send({ name: "Stolen" })
    .expect(404);
  await remove(bob, `/workspaces/${workspace.id}`).expect(404);
  await patch(alice, `/workspaces/${workspace.id}`)
    .send({ name: "Database Lectures", icon: "book" })
    .expect(200);
});
test("validates uploads, rejects forged files and unauthorized workspace uploads", async () => {
  await post(alice, "/documents/upload")
    .field("workspaceId", workspace.id)
    .attach("file", Buffer.from("not a PDF"), {
      filename: "fake.pdf",
      contentType: "application/pdf",
    })
    .expect(400);
  await post(alice, "/documents/upload")
    .field("workspaceId", workspace.id)
    .attach("file", Buffer.alloc(0), {
      filename: "empty.txt",
      contentType: "text/plain",
    })
    .expect(400);
  await post(alice, "/documents/upload")
    .field("workspaceId", workspace.id)
    .attach("file", Buffer.from("<script/>"), {
      filename: "script.html",
      contentType: "text/html",
    })
    .expect(400);
  await post(bob, "/documents/upload")
    .field("workspaceId", workspace.id)
    .attach("file", Buffer.from("Private"), {
      filename: "note.txt",
      contentType: "text/plain",
    })
    .expect(404);
  await post(alice, "/documents/upload")
    .field("workspaceId", workspace.id)
    .attach("file", Buffer.alloc(21 * 1024 * 1024, 65), {
      filename: "large.txt",
      contentType: "text/plain",
    })
    .expect(400);
});
test("uploads private material and atomically creates a durable processing job", async () => {
  document = (
    await post(alice, "/documents/upload")
      .field("workspaceId", workspace.id)
      .attach(
        "file",
        Buffer.from("Normalization reduces duplication in a database."),
        { filename: "Lecture.txt", contentType: "text/plain" },
      )
      .expect(201)
  ).body.data;
  assert.equal(document.status, "PROCESSING");
  assert.equal(document.storedName, undefined);
  const stored = await db.document.findUnique({
    where: { id: document.id },
    include: { job: true },
  });
  files.push(stored.storedName);
  assert.equal(stored.job.state, "PENDING");
  assert.notEqual(stored.storedName, "Lecture.txt");
  await bob.get(`/api/v1/documents/${document.id}`).expect(404);
  await bob.get(`/api/v1/documents/${document.id}/content`).expect(404);
  await patch(bob, `/documents/${document.id}`)
    .send({ name: "Stolen" })
    .expect(404);
  await remove(bob, `/documents/${document.id}`).expect(404);
  const content = await alice
    .get(`/api/v1/documents/${document.id}/content`)
    .expect(200);
  assert.match(content.text, /Normalization/);
});
test("retries only failed processing and resets the job without duplicates", async () => {
  await post(alice, `/documents/${document.id}/reprocess`).expect(409);
  await db.document.update({
    where: { id: document.id },
    data: { status: "FAILED", errorMessage: "Interrupted" },
  });
  await db.processingJob.update({
    where: { documentId: document.id },
    data: { state: "FAILED", attempts: 3 },
  });
  await post(bob, `/documents/${document.id}/reprocess`).expect(404);
  await post(alice, `/documents/${document.id}/reprocess`).expect(200);
  const job = await db.processingJob.findUnique({
    where: { documentId: document.id },
  });
  assert.equal(job.attempts, 0);
  assert.equal(job.state, "PENDING");
  await db.$transaction([
    db.document.update({
      where: { id: document.id },
      data: { status: "READY" },
    }),
    db.processingJob.update({
      where: { documentId: document.id },
      data: { state: "DONE" },
    }),
  ]);
});
test("validates conversation material ownership before creating a chat", async () => {
  await post(bob, "/conversations")
    .send({ scope: "workspace", workspaceId: workspace.id })
    .expect(404);
  await post(bob, "/conversations")
    .send({ scope: "documents", documentIds: [document.id] })
    .expect(400);
  await post(alice, "/conversations")
    .send({ scope: "documents", documentIds: [] })
    .expect(400);
  conversation = (
    await post(alice, "/conversations")
      .send({ scope: "documents", documentIds: [document.id] })
      .expect(201)
  ).body.data;
});
test("saves citations and both messages, resumes chat, and deduplicates request retries", async () => {
  const requestId = randomUUID();
  const input = { content: "What is normalization?", requestId };
  const result = await post(alice, `/conversations/${conversation.id}/messages`)
    .send(input)
    .expect(200);
  assert.equal(result.body.data.sources.length, 1);
  await post(alice, `/conversations/${conversation.id}/messages`)
    .send(input)
    .expect(200);
  const saved = (
    await alice
      .get(`/api/v1/conversations/${conversation.id}?limit=100`)
      .expect(200)
  ).body.data;
  assert.equal(saved.messages.length, 2);
  assert.equal(saved.messages[0].role, "USER");
  assert.equal(saved.messages[1].role, "ASSISTANT");
  await post(alice, `/conversations/${conversation.id}/messages`)
    .send({ content: "Can you explain it simply?", requestId: randomUUID() })
    .expect(200);
  assert.equal(
    await db.message.count({ where: { conversationId: conversation.id } }),
    4,
  );
  await patch(alice, `/conversations/${conversation.id}`)
    .send({ title: "Normalization revision" })
    .expect(200);
  const list = await alice
    .get("/api/v1/conversations?search=Normalization")
    .expect(200);
  assert.equal(list.body.data.total, 1);
});
test("isolates conversation reads, messages, edits, and deletion", async () => {
  await bob.get(`/api/v1/conversations/${conversation.id}`).expect(404);
  await post(bob, `/conversations/${conversation.id}/messages`)
    .send({ content: "Read this", requestId: randomUUID() })
    .expect(404);
  await patch(bob, `/conversations/${conversation.id}`)
    .send({ title: "Stolen" })
    .expect(404);
  await remove(bob, `/conversations/${conversation.id}`).expect(404);
});
test("provider errors preserve history and allow retry; general knowledge is labeled", async () => {
  agentFailure = true;
  await post(alice, `/conversations/${conversation.id}/messages`)
    .send({ content: "Provider down?", requestId: randomUUID() })
    .expect(503);
  assert.equal(
    await db.message.count({ where: { conversationId: conversation.id } }),
    4,
  );
  agentFailure = false;
  const response = await post(
    alice,
    `/conversations/${conversation.id}/messages`,
  )
    .send({
      content: "Explain in general",
      generalKnowledge: true,
      requestId: randomUUID(),
    })
    .expect(200);
  assert.equal(response.body.data.generalKnowledge, true);
  assert.equal(response.body.data.sources.length, 0);
});
test("deleting a document removes its job and leaves historical citations unavailable", async () => {
  await remove(alice, `/documents/${document.id}`).expect(200);
  assert.equal(
    await db.processingJob.count({ where: { documentId: document.id } }),
    0,
  );
  const sources = await db.source.findMany({
    where: { message: { conversationId: conversation.id } },
  });
  assert.ok(sources.length > 0);
  assert.equal(sources[0].documentId, null);
  await alice.get(`/api/v1/documents/${document.id}/content`).expect(404);
});
test("updates profile and password, revokes old sessions, and logs out", async () => {
  await patch(alice, "/users/me").send({ name: "Alice Learner" }).expect(200);
  await patch(alice, "/users/me")
    .send({ name: "Alice", avatarUrl: "javascript:alert(1)" })
    .expect(400);
  await patch(alice, "/users/me/password")
    .send({
      currentPassword: "incorrect",
      password: "Next-password-29!",
      confirmPassword: "Next-password-29!",
    })
    .expect(400);
  const user = await db.user.findUnique({ where: { id: ids[0] } });
  const other = request.agent(app);
  await post(other, "/auth/login")
    .send({ email: user.email, password, rememberMe: true })
    .expect(200);
  await patch(alice, "/users/me/password")
    .send({
      currentPassword: password,
      password: "Next-password-29!",
      confirmPassword: "Next-password-29!",
    })
    .expect(200);
  await other.get("/api/v1/auth/me").expect(401);
  await remove(alice, `/workspaces/${workspace.id}`).expect(200);
  await post(alice, "/auth/logout").expect(200);
  await alice.get("/api/v1/auth/me").expect(401);
});
