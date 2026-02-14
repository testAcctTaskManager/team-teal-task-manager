import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";
import UserManagement from "../../src/pages/UserManagement.jsx";

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("UserManagement", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      if (method === "GET" && String(url) === "/api/users") {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              display_name: "Alice Developer",
              email: "alice@example.com",
              role: "developer",
            },
          ],
        };
      }
      if (method === "PATCH" && String(url) === "/api/users/1") {
        const body = options.body ? JSON.parse(options.body) : {};
        return {
          ok: true,
          json: async () => ({
            id: 1,
            display_name: "Alice Developer",
            email: "alice@example.com",
            role: body.role,
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({ error: "Unhandled request in test" }),
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders fetched users with current role", async () => {
    const { container } = renderWithRoot(<UserManagement />);

    await act(async () => {
      await flushPromises();
    });

    expect(container.textContent).toContain("User Management");
    expect(container.textContent).toContain("Alice Developer");
    expect(container.textContent).toContain("alice@example.com");
    expect(container.textContent).toContain("Current role: developer");
  });

  it("updates a user's role when selecting a new role and clicking Save", async () => {
    const { container } = renderWithRoot(<UserManagement />);

    await act(async () => {
      await flushPromises();
    });

    const select = container.querySelector("select");
    const saveButton = container.querySelector("button");

    expect(select).not.toBeNull();
    expect(saveButton).not.toBeNull();

    await act(async () => {
      select.value = "admin";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    const patchCall = global.fetch.mock.calls.find(([url, options = {}]) => {
      return String(url) === "/api/users/1" && options.method === "PATCH";
    });

    expect(patchCall).toBeTruthy();
    const [, patchOptions] = patchCall;
    expect(JSON.parse(patchOptions.body)).toEqual({ role: "admin" });
    expect(container.textContent).toContain("Updated Alice Developer to admin");
  });
});
