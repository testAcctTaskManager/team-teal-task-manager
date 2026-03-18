import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { UsersProvider, useUsers } from "../../src/contexts/UsersContext.jsx";

/** Tells react that this is a test env where act() is being used to manage
async updates */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Ensure all the async functions have run and have been applied to the DOM. */
function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Minimal component to test context values being stored in UsersContext */
function TestConsumer() {
  const ctx = useUsers();
  return (
    <div>
      <span data-testid="error">{ctx.error ?? ""}</span>
      <span data-testid="users-count">{ctx.users.length}</span>
      <span data-testid="current-user">{ctx.currentUser ? "yes" : "no"}</span>
      <span data-testid="current-user-timezone">{ctx.currentUser?.timezone ?? ""}</span>
      <button data-testid="logout-btn" onClick={ctx.logout}>
        Logout
      </button>
      <button
        data-testid="update-user-btn"
        onClick={() =>
          ctx.updateCurrentUser({ ...ctx.currentUser, timezone: "Europe/London" })
        }
      >
        Update
      </button>
    </div>
  );
}

/**
 * Mounts the TestConsumer component onto the DOM
 * This will mount UsersProvider. React will autorun its useEffect, when mounted.
 * The useEffect calls checkAuth() which calls fetch("/api/auth/me").
 * All tests in this file intercept this fetch with mock data that performs
 * various unit tests.
 */
function renderProvider() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <UsersProvider>
        <TestConsumer />
      </UsersProvider>,
    );
  });
  return container;
}

describe("UsersContext", () => {
  let originalFetch;

  // Save the original global.fetch before each test so it can be restored after.
  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("sets error and empty users when /api/users returns a non-ok response", async () => {
    // Set fetch to intercept fetch call with this mocked data
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/api/auth/me")) {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Alice" }),
        };
      }
      if (String(url).includes("/api/users")) {
        return { ok: false, json: async () => ({ error: "server error" }) };
      }
      return { ok: true, json: async () => [] };
    });

    // mount TestConsumer component onto the DOM
    const container = renderProvider();

    // The act function ensures all async functions have been processed before continuing
    await act(async () => {
      await flushPromises();
    });

    // Expect error return when /api/users returns ok:false
    expect(container.querySelector("[data-testid='error']").textContent).toBe(
      "Unable to load users.",
    );

    // Expect empty user array to be set when /api/users returns ok:false
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("0");
  });

  it("sets error and empty users when /api/users fetch throws a network error", async () => {
    // Set fetch to intercept fetch call with this mocked data
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/api/auth/me")) {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Alice" }),
        };
      }
      if (String(url).includes("/api/users")) {
        throw new Error("Network failure");
      }
      return { ok: true, json: async () => [] };
    });

    // mount TestConsumer component onto the DOM
    const container = renderProvider();

    // The act function ensures all async functions have been processed before continuing
    await act(async () => {
      await flushPromises();
    });

    // Expect this error message if we fail to load users
    expect(container.querySelector("[data-testid='error']").textContent).toBe(
      "Network error loading users.",
    );

    // expect user array to be set to an empty array when is a network error.
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("0");
  });

  it("clears currentUser and users when logout is called", async () => {
    // Set fetch to intercept fetch call with this mocked data
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/api/auth/me")) {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Alice" }),
        };
      }
      if (String(url).includes("/api/users")) {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Alice" }],
        };
      }
      if (String(url).includes("/api/auth/logout")) {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => [] };
    });

    // mount TestConsumer component onto the DOM
    const container = renderProvider();

    // The act function ensures all async functions have been processed before continuing
    await act(async () => {
      await flushPromises();
    });

    // Expect that there is a current user, Alice.
    expect(
      container.querySelector("[data-testid='current-user']").textContent,
    ).toBe("yes");
    // Expect that the number of users in the users array is 1.
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("1");

    // Simulate clicking the logout button and wait for state updates to apply.
    await act(async () => {
      container
        .querySelector("[data-testid='logout-btn']")
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    // after logout, check that there is no current user.
    expect(
      container.querySelector("[data-testid='current-user']").textContent,
    ).toBe("no");
    // after logout, check that there is no users in the user array.
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("0");
  });

  it("still clears state when logout fetch throws", async () => {
    // Set fetch to intercept fetch call with this mocked data
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/api/auth/me")) {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Alice" }),
        };
      }
      if (String(url).includes("/api/users")) {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Alice" }],
        };
      }
      if (String(url).includes("/api/auth/logout")) {
        throw new Error("Network failure");
      }
      return { ok: true, json: async () => [] };
    });

    // mount TestConsumer component onto the DOM
    const container = renderProvider();

    // The act function ensures all async functions have been processed before continuing
    await act(async () => {
      await flushPromises();
    });

    // check that there is a current user
    expect(
      container.querySelector("[data-testid='current-user']").textContent,
    ).toBe("yes");

    // The act function ensures all async functions have been processed before continuing
    await act(async () => {
      container
        .querySelector("[data-testid='logout-btn']")
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    // check that even if logout throws an error, there is no current user
    expect(
      container.querySelector("[data-testid='current-user']").textContent,
    ).toBe("no");
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("0");
  });

  it("updates currentUser and users array when updateCurrentUser is called", async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("/api/auth/me")) {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Alice", timezone: "America/New_York" }),
        };
      }
      if (String(url).includes("/api/users")) {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Alice", timezone: "America/New_York" }],
        };
      }
      return { ok: true, json: async () => [] };
    });

    const container = renderProvider();

    await act(async () => {
      await flushPromises();
    });

    // Verify initial timezone
    expect(
      container.querySelector("[data-testid='current-user-timezone']").textContent,
    ).toBe("America/New_York");

    // Click the update button which calls updateCurrentUser with timezone: "Europe/London"
    await act(async () => {
      container
        .querySelector("[data-testid='update-user-btn']")
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    // Verify timezone was updated in context
    expect(
      container.querySelector("[data-testid='current-user-timezone']").textContent,
    ).toBe("Europe/London");

    // Verify user is still present
    expect(
      container.querySelector("[data-testid='current-user']").textContent,
    ).toBe("yes");

    // Verify users array count is unchanged
    expect(
      container.querySelector("[data-testid='users-count']").textContent,
    ).toBe("1");
  });
});
