import { describe, it, expect } from "vitest";
import { authFetch, authFetchAsAdmin, BASE_URL } from "./helpers.js";

describe("Users API with D1 (integration)", () => {
  it("allows non-admin user listing", async () => {
    const res = await authFetch(`${BASE_URL}/api/users`);
    expect(res.ok).toBe(true);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("allows admin user listing", async () => {
    const res = await authFetchAsAdmin(`${BASE_URL}/api/users`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const adminUser = data.find((u) => u.id === 3);
    expect(adminUser).toBeTruthy();
    if (adminUser) {
      expect(adminUser.email).toBe("carol@example.com");
      expect(adminUser.role).toBeTruthy();
    }
  });

  it("rejects non-admin self role update via PATCH", async () => {
    const patchRes = await authFetch(`${BASE_URL}/api/users/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "clinician" }),
    });
    expect(patchRes.status).toBe(403);
    const body = await patchRes.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("rejects non-self role update via PATCH", async () => {
    const patchRes = await authFetch(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "clinician" }),
    });

    expect(patchRes.status).toBe(403);
    const body = await patchRes.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("allows admin role update via PATCH", async () => {
    const patchRes = await authFetchAsAdmin(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "clinician" }),
    });

    expect(patchRes.ok).toBe(true);
    const updated = await patchRes.json();
    expect(updated.role).toBe("clinician");

    const restoreRes = await authFetchAsAdmin(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "developer" }),
    });
    expect(restoreRes.ok).toBe(true);
  });

  it("rejects invalid role on admin PATCH", async () => {
    const patchRes = await authFetchAsAdmin(`${BASE_URL}/api/users/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "superadmin" }),
    });

    expect(patchRes.status).toBe(400);
    const body = await patchRes.json();
    expect(body).toEqual({ error: "Unknown role." });
  });

  it("prevents the only active admin from deactivating themselves", async () => {
    const patchRes = await authFetchAsAdmin(`${BASE_URL}/api/users/3`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: 0 }),
    });

    expect(patchRes.status).toBe(400);
    const body = await patchRes.json();
    expect(body).toEqual({
      error: "Cannot remove the only active admin account.",
    });
  });

  it("prevents the only active admin from demoting themselves", async () => {
    const patchRes = await authFetchAsAdmin(`${BASE_URL}/api/users/3`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "developer" }),
    });

    expect(patchRes.status).toBe(400);
    const body = await patchRes.json();
    expect(body).toEqual({
      error: "Cannot remove the only active admin account.",
    });
  });
});
