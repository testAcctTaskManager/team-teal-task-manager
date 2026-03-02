import { describe, it, expect } from "vitest";
import { authFetch, BASE_URL } from "./helpers.js";

describe("Tasks API with D1 (integration)", () => {
  it("returns seeded tasks from the database", async () => {
    const res = await authFetch(`${BASE_URL}/api/tasks`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const task1 = data.find((t) => t.id === 1);
    expect(task1).toBeTruthy();
    if (task1) {
      expect(task1.title).toBe("Set up project");
    }
  });

  it("can create a comment and read it back", async () => {
    const uniqueContent = `Integration comment ${Date.now()}`;

    const createRes = await authFetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: 1,
        created_by: 1,
        content: uniqueContent,
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created).toBeTruthy();
    expect(created.content).toBe(uniqueContent);

    const getRes = await authFetch(`${BASE_URL}/api/comments?task_id=1`);
    expect(getRes.ok).toBe(true);

    const comments = await getRes.json();
    expect(Array.isArray(comments)).toBe(true);
    const found = comments.find((c) => c.content === uniqueContent);
    expect(found).toBeTruthy();
  });

  it("Rejects creating a task with a sprint that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: 1,
        title: "Bad Sprint Task",
        created_by: 1,
        sprint_id: 99999,
      }),
    });
    expect([400, 500]).toContain(res.status);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  it("Rejects updating a task to a sprint that does not exist", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sprint_id: 99999,
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("Can change to a different sprint", async () => {
    const createRes = await fetch(`${BASE_URL}/api/tasks/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: 1,
        sprint_id: 2,
      }),
    });

    expect(createRes.status).toBe(200);
    const created = await createRes.json();

    expect(created).toBeTruthy();
    expect(created.sprint_id).toBe(2);
  });
});
