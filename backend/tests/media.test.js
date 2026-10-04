import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import http from "node:http";
import request from "supertest";
import { youtubeReference } from "../src/services/youtube.js";
let app,
  db,
  server,
  alice,
  bob,
  user,
  other,
  workspace,
  report,
  failed = false,
  invalid = false;
const origin = process.env.FRONTEND_URL;
const post = (client, path, body) =>
  client.post(`/api/v1${path}`).set("Origin", origin).send(body);
before(async () => {
  assert.ok(
    new URL(process.env.DATABASE_URL).pathname.startsWith("/study_mind_test_"),
  );
  server = http.createServer(async (req, res) => {
    for await (const part of req) assert.ok(part);
    assert.equal(req.headers["x-agent-secret"], process.env.AGENT_SECRET);
    res.setHeader("Content-Type", "application/json");
    if (failed) {
      res.writeHead(503);
      res.end("{}");
      return;
    }
    res.end(
      JSON.stringify({
        content: "A supported statement.",
        sources: [
          { url: "https://example.org/source", title: "Primary source" },
        ],
        supports: [
          { text: "A supported statement.", sourceIndices: [invalid ? 99 : 0] },
        ],
        suggestionsHtml: "<p>Google Search suggestions</p>",
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.AGENT_API_URL = `http://127.0.0.1:${server.address().port}`;
  ({ app } = await import("../src/app.js"));
  ({ db } = await import("../src/config/database.js"));
  alice = request.agent(app);
  bob = request.agent(app);
  for (const [client, name] of [
    [alice, "Media Alice"],
    [bob, "Media Bob"],
  ]) {
    const password = "Media-test-password-83!";
    const res = await post(client, "/auth/register", {
      name,
      email: `${randomUUID()}@example.test`,
      password,
      confirmPassword: password,
    }).expect(201);
    if (client === alice) user = res.body.data;
    else other = res.body.data;
  }
  workspace = (
    await post(alice, "/workspaces", {
      name: "Lecture imports",
      icon: "book",
    }).expect(201)
  ).body.data;
});
after(async () => {
  if (db) {
    await db.user.deleteMany({
      where: { id: { in: [user?.id, other?.id].filter(Boolean) } },
    });
    await db.$disconnect();
  }
  if (server) await new Promise((resolve) => server.close(resolve));
});
test("YouTube references canonicalize without fetching user-provided URLs", () => {
  assert.equal(
    youtubeReference("https://youtu.be/9hE5-98ZeCg?t=5").url,
    "https://www.youtube.com/watch?v=9hE5-98ZeCg",
  );
  for (const url of [
    "https://localhost/private",
    "https://youtube.com.evil.test/watch?v=9hE5-98ZeCg",
    "http://youtu.be/9hE5-98ZeCg",
    "https://user:pass@youtube.com/watch?v=9hE5-98ZeCg",
    "https://youtube.com/watch?v=invalid",
  ])
    assert.throws(() => youtubeReference(url));
});
test("image and audio uploads validate signatures, modes and ownership", async () => {
  const upload = (client, filename, type, data) =>
    client
      .post("/api/v1/documents/upload")
      .set("Origin", origin)
      .field("workspaceId", workspace.id)
      .attach("file", data, { filename, contentType: type });
  await upload(
    bob,
    "image.png",
    "image/png",
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  ).expect(404);
  await upload(alice, "image.png", "image/png", Buffer.from("forged")).expect(
    400,
  );
  await upload(alice, "lecture.wav", "audio/wav", Buffer.from("forged")).expect(
    400,
  );
  await alice
    .post("/api/v1/documents/upload")
    .set("Origin", origin)
    .field("workspaceId", workspace.id)
    .field("extractionMode", "VISION")
    .attach("file", Buffer.from("Readable text"), {
      filename: "notes.txt",
      contentType: "text/plain",
    })
    .expect(400);
  const png = (
    await upload(
      alice,
      "image.png",
      "image/png",
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ).expect(201)
  ).body.data;
  assert.equal(png.extractionMode, "TEXT");
  assert.ok(!png.storedName);
  assert.equal(
    await db.processingJob.count({ where: { documentId: png.id } }),
    1,
  );
});
test("YouTube import queues private reference and rejects foreign workspaces", async () => {
  const input = {
    workspaceId: workspace.id,
    title: "Public lecture",
    url: "https://youtu.be/9hE5-98ZeCg",
  };
  await post(bob, "/documents/youtube", input).expect(404);
  await post(alice, "/documents/youtube", {
    ...input,
    url: "https://127.0.0.1/private",
  }).expect(400);
  const document = (await post(alice, "/documents/youtube", input).expect(201))
    .body.data;
  assert.equal(document.extractionMode, "YOUTUBE");
  assert.equal(
    document.sourceUrl,
    "https://www.youtube.com/watch?v=9hE5-98ZeCg",
  );
  assert.ok(!document.storedName);
  await bob.get(`/api/v1/documents/${document.id}/content`).expect(404);
});
test("web research saves validated evidence, deduplicates retries and isolates accounts", async () => {
  const input = {
    query: "Research primary source evidence.",
    requestId: randomUUID(),
  };
  report = (await post(alice, "/research", input).expect(201)).body.data;
  assert.equal(
    (await post(alice, "/research", input).expect(200)).body.data.id,
    report.id,
  );
  await bob.get(`/api/v1/research/${report.id}`).expect(404);
  assert.equal((await bob.get("/api/v1/research")).body.data.total, 0);
  assert.equal(
    (await alice.get(`/api/v1/research/${report.id}`)).body.data.supports[0]
      .sourceIndices[0],
    0,
  );
});
test("research provider errors and invented evidence indices never save a report", async () => {
  invalid = true;
  await post(alice, "/research", {
    query: "Invalid source indices",
    requestId: randomUUID(),
  }).expect(503);
  invalid = false;
  failed = true;
  await post(alice, "/research", {
    query: "Provider is unavailable",
    requestId: randomUUID(),
  }).expect(503);
  failed = false;
  assert.equal(
    await db.researchReport.count({ where: { userId: user.id } }),
    1,
  );
  await alice
    .delete(`/api/v1/research/${report.id}`)
    .set("Origin", origin)
    .expect(200);
  assert.equal(
    await db.researchReport.count({ where: { userId: user.id } }),
    0,
  );
});
