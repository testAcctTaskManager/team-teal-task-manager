import { describe, it, expect } from "vitest";

const DEV_PORT = process.env.WRANGLER_DEV_PORT ?? "8788";
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;

describe("Tasks API with D1 (integration)", () => {
  it("returns seeded tasks from the database", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`);
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

    const createRes = await fetch(`${BASE_URL}/api/comments`, {
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

    const getRes = await fetch(`${BASE_URL}/api/comments?task_id=1`);
    expect(getRes.ok).toBe(true);

    const comments = await getRes.json();
    expect(Array.isArray(comments)).toBe(true);
    const found = comments.find((c) => c.content === uniqueContent);
    expect(found).toBeTruthy();
  });
});
