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

// Port and URL for Vite dev server (needed for Cypress e2e tests).
const VITE_PORT = process.env.VITE_DEV_PORT ?? "5173";
const VITE_URL = `http://127.0.0.1:${VITE_PORT}`;

function spawnProcess(command, args, options = {}) {
  const isWindows = process.platform === "win32";
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    // On Unix, start process in its own process group so we can kill the entire tree
    detached: !isWindows,
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

// Kill orphaned wrangler/vite processes that may be holding file locks.
async function killOrphanedProcesses() {
  if (process.platform === "win32") {
    // Kill any lingering wrangler processes
    await new Promise((resolve) => {
      const kill = spawn("taskkill", ["/IM", "wrangler.exe", "/F"], {
        stdio: "ignore",
        shell: true,
      });
      kill.on("exit", resolve);
    });
    // Small delay to let OS release file locks
    await delay(500);
  }
}

// Retry fs.rm with delays for Windows file lock issues.
async function rmWithRetry(dirPath, maxRetries = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      return;
    } catch (err) {
      if (err.code === "EBUSY" && attempt < maxRetries) {
        console.log(
          `[test-with-server] Directory busy, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`,
        );
        await delay(delayMs);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  // 0) Kill any orphaned processes from previous runs.
  console.log("Cleaning up any orphaned processes...");
  await killOrphanedProcesses();

  // 1) Start from a clean local D1 database.
  console.log("Wiping local D1 test database files (if any)...");

  try {
    await rmWithRetry(PERSIST_DIR_ABS);
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

  // 3b) Start Vite dev server for Cypress e2e tests.
  console.log("Starting Vite dev server for Cypress e2e tests...");
  const viteArgs = ["--port", VITE_PORT, "--strictPort", "--host", "127.0.0.1"];
  const vite = spawnProcess("npx", ["vite", ...viteArgs]);

  let cleanedUp = false;

  // Ensure both Wrangler and Vite dev processes are cleaned up on exit/signals.
  const cleanup = (exitAfter = false) => {
    if (cleanedUp) return;
    cleanedUp = true;

    if (process.platform === "win32") {
      // Kill wrangler and its process tree
      if (wrangler && !wrangler.killed) {
        spawn("taskkill", ["/PID", String(wrangler.pid), "/T", "/F"], {
          stdio: "inherit",
          shell: true,
        });
      }
      // Kill vite and its process tree
      if (vite && !vite.killed) {
        spawn("taskkill", ["/PID", String(vite.pid), "/T", "/F"], {
          stdio: "inherit",
          shell: true,
        });
      }
    } else {
      // On Unix, kill the entire process group (negative PID) to terminate child processes
      if (wrangler && wrangler.pid && !wrangler.killed) {
        try {
          process.kill(-wrangler.pid, "SIGTERM");
        } catch {
          // Process may already be dead
        }
      }
      if (vite && vite.pid && !vite.killed) {
        try {
          process.kill(-vite.pid, "SIGTERM");
        } catch {
          // Process may already be dead
        }
      }
    }

    if (exitAfter) {
      // Give cleanup a moment to terminate processes, then force exit
      setTimeout(() => process.exit(process.exitCode ?? 1), 500);
    }
  };

  // Handle interruption signals (Ctrl+C, kill)
  process.on("SIGINT", () => cleanup(true));
  process.on("SIGTERM", () => cleanup(true));

  // 4) Wait until both dev servers are reachable before testing.
  await waitForServer(DEV_URL);
  console.log(`Wrangler dev server (test env) is ready at ${DEV_URL}`);

  await waitForServer(VITE_URL);
  console.log(`Vite dev server is ready at ${VITE_URL}`);

  console.log("All servers ready, running tests...");

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

  // Also set CYPRESS_ prefixed vars for Cypress to pick up automatically
  process.env.CYPRESS_TEST_SESSION_TOKEN = testToken;
  process.env.CYPRESS_TEST_ADMIN_SESSION_TOKEN = adminTestToken;
  process.env.CYPRESS_TEST_MUTABLE_SESSION_TOKEN = mutableTestToken;

  try {
    // 5) Run the Vitest integration tests that rely on Wrangler + D1.
    console.log("\n--- Running Vitest API integration tests ---");
    await run("npm", ["run", "test:integration:vitest"], { env: process.env });

    // 6) Run Cypress e2e tests that use the full browser + Vite + Wrangler.
    console.log("\n--- Running Cypress e2e integration tests ---");
    await run("npm", ["run", "test:e2e"], { env: process.env });

    process.exitCode = 0;
  } catch (err) {
    console.error(err.message ?? err);
    process.exitCode = 1;
  } finally {
    cleanup(true);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
