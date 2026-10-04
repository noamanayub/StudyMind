import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const python = process.platform === "win32" ? "python" : "python3";
const child = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "app.main:app",
    "--app-dir",
    "agent",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
  ],
  { cwd: root, stdio: "inherit" },
);
child.on("error", () => {
  console.error("Install Python and packages from agent/requirements-lock.txt first.");
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
