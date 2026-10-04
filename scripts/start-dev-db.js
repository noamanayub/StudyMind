import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "dotenv";

const root = fileURLToPath(new URL("../", import.meta.url));
const envPath = path.join(root, "backend", ".env");
const config = existsSync(envPath) ? parse(readFileSync(envPath)) : {};
const databaseUrl = process.env.DATABASE_URL ?? config.DATABASE_URL;

if (!databaseUrl) {
  console.error("Configure backend/.env before starting. See README.md for initial setup.");
  process.exit(1);
}

let database;
try {
  database = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  process.exit(1);
}

const usesLocalDatabase =
  ["127.0.0.1", "localhost"].includes(database.hostname) &&
  database.port === "5433";

if (process.platform === "win32" && usesLocalDatabase) {
  console.info("Starting workspace PostgreSQL (already-running instances are reused)...");
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-File", path.join(root, "scripts", "start-local-db.ps1")],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error || result.status !== 0) {
    console.error("Could not start workspace PostgreSQL. See README.md for database setup.");
    process.exit(1);
  }
} else {
  console.info("Using configured PostgreSQL; ensure your external database is running.");
}
