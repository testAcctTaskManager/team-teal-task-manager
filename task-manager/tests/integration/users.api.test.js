import { describe, it, expect } from "vitest";

const DEV_PORT = process.env.WRANGLER_DEV_PORT ?? "8788";
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;

describe("Users API with D1 (integration)", () => {
  it("returns seeded users from the database", async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
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

  it("prevents creating a user with a duplicate email", async () => {
    // alice@example.com is seeded in 007_data_seed.sql with id=1
    const createRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: "Duplicate Alice",
        email: "alice@example.com",
        timezone: "UTC",
      }),
    });

    expect(createRes.status).toBe(400);
    const errorBody = await createRes.json();
    expect(errorBody).toBeTruthy();
    expect(errorBody.error).toBe("Email already in use");
  });
});
