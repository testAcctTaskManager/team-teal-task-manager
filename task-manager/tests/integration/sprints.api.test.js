import { describe, it, expect } from "vitest";

const DEV_PORT = process.env.WRANGLER_DEV_PORT ?? "8788";
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;

describe("Sprints API with D1 (integration)", () => {
  it("Returns seeded Sprint from database", async () => {
    const res = await fetch(`${BASE_URL}/api/sprints`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check that sprint with id = 1 exists (from the seed file)
    const sprint1 = data.find((s) => s.id === 1);
    expect(sprint1).toBeTruthy();

    if (sprint1) {
      expect(sprint1.project_id).toBeDefined();
      expect(sprint1.name).toBeDefined();
      expect(sprint1.created_by).toBeDefined();
      expect(sprint1.updated_at).toBeDefined();
      expect(sprint1.created_at).toBeDefined();
    }
  });

  it("Creates a new sprint with default timestamps", async () => {
    // Create a sprint
    const createRes = await fetch(`${BASE_URL}/api/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: 1,
        name: "Integration Test Sprint",
        created_by: 1,
      }),
    });

    // Assertions
    expect(createRes.ok).toBe(true);
    const created = await createRes.json();
    expect(created.name).toBe("Integration Test Sprint");
    expect(created.created_by).toBe(1);
    expect(created.created_at).toBeDefined();
    expect(created.updated_at).toBeDefined();
  });

  it("Updates a sprints's start_date and end_date and refreshes updated_at", async () => {
    // First create a sprint
    const createRes = await fetch(`${BASE_URL}/api/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: 1,
        name: "Update Test Sprint",
        created_by: 1,
      }),
    });

    const created = await createRes.json();
    const id = created.id;
    // Check validity
    expect(id).toBeDefined();

    // Update status
    const updateRes = await fetch(`${BASE_URL}/api/sprints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: "2026-03-14",
        end_date: "2026-04-15",
      }),
    });

    const updated = await updateRes.json();

    expect(updateRes.ok).toBe(true);
    expect(updated.end_date).toBe("2026-04-15");
    expect(updated.start_date).toBe("2026-03-14");
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  it("Rejects a sprint missing required fields", async () => {
    const res = await fetch(`${BASE_URL}/api/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bad Sprint",
        // missing project_id and created_by
      }),
    });
    expect([400, 500]).toContain(res.status);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  it("Returns 404 for a sprint that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/api/sprints/99999`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  it("Deletes a sprint and confirms it is gone", async () => {
    const createRes = await fetch(`${BASE_URL}/api/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: 1,
        name: "Delete Test Sprint",
        created_by: 1,
      }),
    });
    const created = await createRes.json();
    const id = created.id;
    expect(id).toBeDefined();

    const deleteRes = await fetch(`${BASE_URL}/api/sprints/${id}`, {
      method: "DELETE",
    });
    expect(deleteRes.ok).toBe(true);

    // Should not be able to find deleted sprint
    const getRes = await fetch(`${BASE_URL}/api/sprints/${id}`);
    expect(getRes.status).toBe(404);
  });
});
