// Script to run integration tests against a local Wrangler Pages
// dev server backed by a fresh local D1 database.

import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SignJWT } from "jose";

// Resolve project root (one level up from this script file).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Dedicated local persistence directory for the D1 test database.
// Wiping this folder guarantees a clean DB for each run.
const PERSIST_DIR = ".wrangler/test-db";
const PERSIST_DIR_ABS = path.join(projectRoot, PERSIST_DIR);

// Port and URL where Wrangler dev server will listen for tests.
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

// Poll the given URL until the server responds or timeout is reached.
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

  throw new Error(
    `Server at ${url} did not become ready within ${timeoutMs}ms`,
  );
}

// Convenience wrapper around spawnProcess that resolves/rejects
// based on the child process exit code.
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, options);

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(" ")} exited with code ${code}`),
        );
    });
  });
}

async function main() {
  // 1) Start from a clean local D1 database.
  console.log("Wiping local D1 test database files (if any)...");

  try {
    await fs.rm(PERSIST_DIR_ABS, { recursive: true, force: true });
    console.log(
      `[test-with-server] Removed ${PERSIST_DIR_ABS} (if it existed).`,
    );
  } catch (err) {
    console.error(
      "[test-with-server] Error while wiping test DB directory:",
      err,
    );
    throw new Error("Wiping local test DB failed");
  }

  // 2) Apply all D1 migrations into the fresh local DB.
  console.log(
    "Applying D1 migrations for local test database (default env)...",
  );
  // Run migrations non-interactively by piping "y" to Wrangler's prompt.
  const migrate = spawn(
    "wrangler",
    [
      "d1",
      "migrations",
      "apply",
      "cf_db",
      "--local",
      "--persist-to",
      PERSIST_DIR,
    ],
    {
      stdio: ["pipe", "inherit", "inherit"],
      shell: process.platform === "win32",
    },
  );

  // Auto-confirm "yes" to apply migrations when prompted
  migrate.stdin.write("y\n");
  migrate.stdin.end();

  await new Promise((resolve, reject) => {
    migrate.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("D1 test migrations failed"));
    });
  });

  // 2b) Apply seed data (dev/test only — not run in production).
  console.log("Applying seed data to local test database...");
  const seedFile = path.join(projectRoot, "seed", "seed.sql");
  const seed = spawn(
    "wrangler",
    [
      "d1",
      "execute",
      "cf_db",
      "--local",
      "--persist-to",
      PERSIST_DIR,
      "--file",
      seedFile,
    ],
    {
      stdio: ["pipe", "inherit", "inherit"],
      shell: process.platform === "win32",
    },
  );

  seed.stdin.write("y\n");
  seed.stdin.end();

  await new Promise((resolve, reject) => {
    seed.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("D1 seed data failed"));
    });
  });

  // 3) Start Wrangler Pages dev server backed by this DB.
  console.log(
    "Starting Wrangler Pages dev server for tests (local default env)...",
  );

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

  // Ensure the Wrangler dev process is cleaned up on exit/signals.
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

  // 4) Wait until the dev server is reachable before testing.
  await waitForServer(DEV_URL);
  console.log(
    `Wrangler dev server (test env) is ready at ${DEV_URL}, running all tests...`,
  );

  // 4b) Generate a signed JWT so integration tests can authenticate.
  //     Read JWT_SECRET from .dev.vars (same file Wrangler reads for local secrets).
  const devVarsPath = path.join(projectRoot, ".dev.vars");
  let jwtSecret = "test-integration-secret";
  try {
    const devVarsContent = await fs.readFile(devVarsPath, "utf-8");
    const match = devVarsContent.match(/^JWT_SECRET=(.+)$/m);
    if (match) jwtSecret = match[1].trim();
  } catch {
    console.warn(
      "[test-with-server] Could not read .dev.vars; using default test JWT secret",
    );
  }

  const secret = new TextEncoder().encode(jwtSecret);
  // Developer Test Token
  const testToken = await new SignJWT({ sub: "1", email: "alice@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
  // Admin Test Token
  const adminTestToken = await new SignJWT({
    sub: "3",
    email: "carol@example.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
  // Mutable-role Test Token (reserved for tests that intentionally change role/state)
  const mutableTestToken = await new SignJWT({
    sub: "2",
    email: "bob@example.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  process.env.TEST_SESSION_TOKEN = testToken;
  process.env.TEST_ADMIN_SESSION_TOKEN = adminTestToken;
  process.env.TEST_MUTABLE_SESSION_TOKEN = mutableTestToken;

  try {
    // 5) Run only the integration tests that rely on Wrangler + D1.
    await run("npm", ["run", "test:integration:vitest"], { env: process.env });

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
