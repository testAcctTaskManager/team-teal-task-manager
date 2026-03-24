import { beforeEach, describe, expect, it, vi } from "vitest";

// use a mock version of our crypto library
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from "jose";
import { onRequest } from "../../functions/api/_middleware.js";

// Create mock DB with Users and Comments tables
function makeDbWithRows(rows) {
  return {
    prepare: vi.fn((sql) => ({
      bind: vi.fn(() => ({
        first: vi.fn(async () => {
          if (sql.includes("FROM Users")) {
            return rows.user ?? null;
          }
          if (sql.includes("FROM Comments")) {
            return rows.comment ?? null;
          }
          return null;
        }),
      })),
    })),
  };
}

// Populate mock DB Users and Comments tables
function makeContext({
  method = "GET",
  path = "/api/users",
  user,
  comment,
} = {}) {
  const request = new Request(`https://example.test${path}`, { method });
  const db = makeDbWithRows({ user, comment });
  const next = vi.fn(async () => new Response("next-ok", { status: 200 }));

  return {
    request,
    next,
    env: {
      JWT_SECRET: "test-secret",
      cf_db: db,
    },
    data: {},
  };
}

// Test authorization middleware
describe("api middleware authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jwtVerify.mockResolvedValue({
      payload: { sub: "2", email: "user@example.com" },
    });
  });

  it("allows OPTIONS preflight without auth", async () => {
    const context = makeContext({ method: "OPTIONS", path: "/api/users" });
    const res = await onRequest(context);
    expect(context.next).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  // TODO: change this test if we restrict who can see api/users
  it("allows developer on /api/users route", async () => {
    const context = makeContext({
      path: "/api/users",
      user: { id: 2, email: "user@example.com", role: "developer", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/users", {
      method: "GET",
      headers: { Cookie: "session=test-token" },
    });

    const res = await onRequest(context);
    expect(res.status).toBe(200);
    expect(context.next).toHaveBeenCalledTimes(1);
  });

  it("allows admin on admin-only route", async () => {
    const context = makeContext({
      path: "/api/users",
      user: { id: 2, email: "user@example.com", role: "admin", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/users", {
      method: "GET",
      headers: { Cookie: "session=test-token" },
    });

    const res = await onRequest(context);
    expect(res.status).toBe(200);
    expect(context.next).toHaveBeenCalledTimes(1);
  });

  it("enforces SELF for /api/users/:id", async () => {
    const context = makeContext({
      path: "/api/users/3",
      user: { id: 2, email: "user@example.com", role: "developer", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/users/3", {
      method: "PATCH",
      headers: {
        Cookie: "session=test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone: "UTC" }),
    });

    const res = await onRequest(context);
    expect(res.status).toBe(403);
    expect(context.next).not.toHaveBeenCalled();
  });

  it("allows SELF when :id matches current user", async () => {
    const context = makeContext({
      path: "/api/users/2",
      user: { id: 2, email: "user@example.com", role: "developer", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/users/2", {
      method: "PATCH",
      headers: {
        Cookie: "session=test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone: "UTC" }),
    });

    const res = await onRequest(context);
    expect(res.status).toBe(200);
    expect(context.next).toHaveBeenCalledTimes(1);
  });

  it("enforces OWN_COMMENT", async () => {
    const context = makeContext({
      path: "/api/comments/7",
      user: { id: 2, email: "user@example.com", role: "clinician", is_active: 1 },
      comment: { created_by: 3 },
    });
    context.request = new Request("https://example.test/api/comments/7", {
      method: "PATCH",
      headers: {
        Cookie: "session=test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: "changed" }),
    });

    const res = await onRequest(context);
    expect(res.status).toBe(403);
    expect(context.next).not.toHaveBeenCalled();
  });

  it("defaults unknown route to forbidden", async () => {
    const context = makeContext({
      path: "/api/not-in-matrix",
      user: { id: 2, email: "user@example.com", role: "admin", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/not-in-matrix", {
      method: "GET",
      headers: { Cookie: "session=test-token" },
    });

    const res = await onRequest(context);
    expect(res.status).toBe(403);
    expect(context.next).not.toHaveBeenCalled();
  });

  it("defaults unknown role to forbidden", async () => {
    const context = makeContext({
      path: "/api/projects",
      user: { id: 2, email: "user@example.com", role: "superadmin", is_active: 1 },
    });
    context.request = new Request("https://example.test/api/projects", {
      method: "GET",
      headers: { Cookie: "session=test-token" },
    });

    const res = await onRequest(context);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Invalid role" });
    expect(context.next).not.toHaveBeenCalled();
  });
});
