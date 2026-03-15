import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";
import UserManagement from "../../src/pages/UserManagement.jsx";

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("UserManagement", () => {
  let originalFetch;
  // Mock the network layer to deliver expected responses
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

  it("shows error message when /api/users returns a non-ok response", async () => {
    // override global fetch just for this test to produce error
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Server error" }),
    }));

    const { container } = renderWithRoot(<UserManagement />);

    // Ensure all the async functions in UserManagement have run and have been applied to the DOM.
    await act(async () => {
      await flushPromises();
    });

    expect(container.textContent).toContain(
      "Unable to load users from server.",
    );
    expect(container.querySelectorAll("#user-list > div")).toHaveLength(0);
  });

  it("shows error message when fetch throws a network error", async () => {
    // override global fetch just for this test to produce error
    global.fetch = vi.fn(async () => {
      throw new Error("Network failure");
    });

    const { container } = renderWithRoot(<UserManagement />);

    // Ensure all the async functions in UserManagement have run and have been applied to the DOM.
    await act(async () => {
      await flushPromises();
    });

    expect(container.textContent).toContain("Network error loading users");
    expect(container.querySelectorAll("#user-list > div")).toHaveLength(0);
  });

  it("shows error message when PATCH returns a non-ok response", async () => {
    // Override only the PATCH to fail; GET still uses the beforeEach mock.
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
        return {
          ok: false,
          json: async () => ({ error: "Server error" }),
        };
      }
    });

    const { container } = renderWithRoot(<UserManagement />);

    // Ensure all the async functions in UserManagement have run and have been applied to the DOM.
    await act(async () => {
      await flushPromises();
    });

    const select = container.querySelector("select");
    const saveButton = container.querySelector("button");

    await act(async () => {
      select.value = "admin";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain("Could not update role.");
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

  it("save button is disabled when the selected role has not changed", async () => {
    const { container } = renderWithRoot(<UserManagement />);

    // Ensure all the async functions in UserManagement have run and have been applied to the DOM.
    await act(async () => {
      await flushPromises();
    });

    const select = container.querySelector("select");
    const saveButton = container.querySelector("button");

    expect(select).not.toBeNull();
    expect(saveButton).not.toBeNull();

    expect(saveButton.disabled).toBe(true);

    await act(async () => {
      select.value = "admin";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(saveButton.disabled).toBe(false);
  });

  it("only updates the indicated user's role when multiple users exist", async () => {
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
            {
              id: 2,
              display_name: "Bob Admin",
              email: "bob@example.com",
              role: "admin",
            },
          ],
        };
      }
      if (method === "PATCH" && String(url) === "/api/users/1") {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            display_name: "Alice Developer",
            email: "alice@example.com",
            role: "admin",
          }),
        };
      }
    });

    const { container } = renderWithRoot(<UserManagement />);

    // Ensure all the async functions in UserManagement have run and have been applied to the DOM.
    await act(async () => {
      await flushPromises();
    });

    const selects = container.querySelectorAll("select");
    const saveButtons = container.querySelectorAll("button");

    expect(selects).toHaveLength(2);
    expect(saveButtons).toHaveLength(2);

    await act(async () => {
      selects[0].value = "admin";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      saveButtons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain("Updated Alice Developer to admin");
    expect(container.textContent).toContain("Current role: admin");
    expect(container.textContent).toContain("Bob Admin");
  });
});
