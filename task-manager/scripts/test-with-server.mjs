import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Use a dedicated local persistence directory for D1 so tests can
// fully reset the DB by wiping this folder.
const PERSIST_DIR = ".wrangler/test-db";
const PERSIST_DIR_ABS = path.join(projectRoot, PERSIST_DIR);

const DEV_PORT = process.env.WRANGLER_DEV_PORT ?? "8788";
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  return child;
}

async function waitForServer(url, timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const isUp = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (isUp) return;
    await delay(intervalMs);
  }

  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, options);

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("Wiping local D1 test database files (if any)...");

  try {
    await fs.rm(PERSIST_DIR_ABS, { recursive: true, force: true });
    console.log(`[test-with-server] Removed ${PERSIST_DIR_ABS} (if it existed).`);
  } catch (err) {
    console.error("[test-with-server] Error while wiping test DB directory:", err);
    throw new Error("Wiping local test DB failed");
  }

  console.log("Applying D1 migrations for local test database (default env)...");
  // Run migrations non-interactively by piping "y" to Wrangler's prompt
  const migrate = spawn("wrangler", [
    "d1",
    "migrations",
    "apply",
    "cf_db",
    "--local",
    "--persist-to",
    PERSIST_DIR,
  ], {
    stdio: ["pipe", "inherit", "inherit"],
    shell: process.platform === "win32",
  });

  // Auto-confirm "yes" to apply migrations when prompted
  migrate.stdin.write("y\n");
  migrate.stdin.end();

  await new Promise((resolve, reject) => {
    migrate.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("D1 test migrations failed"));
    });
  });

  console.log("Starting Wrangler Pages dev server for tests (local default env)...");

  const wranglerArgs = [
    "pages",
    "dev",
    "--local",
    "--persist-to",
    PERSIST_DIR,
    "--port",
    DEV_PORT,
  ];
  const wrangler = spawnProcess("wrangler", wranglerArgs);

  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    if (wrangler && !wrangler.killed) {
      if (process.platform === "win32") {
        // Kill wrangler and its process tree
        spawn("taskkill", ["/PID", String(wrangler.pid), "/T", "/F"], {
          stdio: "inherit",
          shell: true,
        });
      } else {
        wrangler.kill("SIGINT");
      }
    }
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  await waitForServer(DEV_URL);
  console.log(
    `Wrangler dev server (test env) is ready at ${DEV_URL}, running all tests...`,
  );

  try {
    await run("npx", ["vitest", "run"], { env: process.env });
    await run("npx", [
      "cypress",
      "run",
      "--component",
      "--config-file",
      "cypress.config.mjs",
    ], { env: process.env });

    process.exitCode = 0;
  } catch (err) {
    console.error(err.message ?? err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
