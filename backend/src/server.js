import { app } from "./app.js";
import { db } from "./config/database.js";
import { env } from "./config/env.js";
const server = app.listen(env.PORT, "127.0.0.1", () =>
  console.info(`Study Mind API: http://127.0.0.1:${env.PORT}`),
);
async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
