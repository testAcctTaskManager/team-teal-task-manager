import { describe, it, expect } from "vitest";
import { authFetch, BASE_URL } from "./helpers.js";

describe("Users API with D1 (integration)", () => {
  it("returns seeded users from the database", async () => {
    const res = await authFetch(`${BASE_URL}/api/users`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const user1 = data.find((u) => u.id === 1);
    expect(user1).toBeTruthy();
    if (user1) {
      expect(user1.display_name).toBe("Alice Developer");
      expect(user1.email).toBe("alice@example.com");
    }
  });

  it("returns seeded users with role", async () => {
    const res = await authFetch(`${BASE_URL}/api/users`);
    const data = await res.json();
    const user1 = data.find((u) => u.id === 1);
    expect(user1.role).toBeTruthy();
  });

  it("updates a user's role via PATCH", async () => {
    const patchRes = await authFetch(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "clinician" }),
    });
    expect(patchRes.ok).toBe(true);

    const updated = await patchRes.json();
    expect(updated.role).toBe("clinician");
  });

  it("rejects invalid role on PATCH", async () => {
    const patchRes = await authFetch(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "superadmin" }),
    });

    expect(patchRes.status).toBe(400);
    const body = await patchRes.json();
    expect(body).toEqual({ error: "Unknown role." });
  });

});
