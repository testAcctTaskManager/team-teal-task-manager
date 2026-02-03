import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TaskDetail from "../../src/pages/TaskDetail.jsx";

// Enable React act() support in this test environment
// eslint-disable-next-line no-undef
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderTaskDetail(initialPath = "/task/42") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

describe("TaskDetail (Vitest)", () => {
  const taskId = "42";
  let originalFetch;
  let fetchMock;
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalFetch = global.fetch;

    fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      const urlStr = String(url);

      if (method === "GET") {
        if (urlStr.startsWith("/api/tasks/")) {
          return {
            ok: true,
            json: async () => ({ id: Number(taskId), title: "Task" }),
          };
        }
        if (urlStr.startsWith("/api/comments")) {
          return {
            ok: true,
            json: async () => [],
          };
        }
      }

      if (method === "POST" && urlStr === "/api/comments") {
        const body = options.body ? JSON.parse(options.body) : {};
        return {
          ok: true,
          json: async () => ({
            id: 100,
            task_id: Number(taskId),
            content: body.content,
            created_by: "alice",
            created_at: "2025-01-01T00:00:00.000Z",
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({ error: "unhandled" }),
      };
    });

    global.fetch = fetchMock;
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does not post empty comments", async () => {
    const { container } = renderTaskDetail(`/task/${taskId}`);

    const addButton = container.querySelector("button");
    expect(addButton).not.toBeNull();

    await act(async () => {
      addButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const postCalls = fetchMock.mock.calls.filter(([, options = {}]) => {
      return options.method === "POST" && String(options.body || "").includes("task_id");
    });

    expect(postCalls.length).toBe(0);
  });

  it("does not post comments that are only whitespace", async () => {
    const { container } = renderTaskDetail(`/task/${taskId}`);

    const textarea = container.querySelector("textarea.comments-textbox");
    const addButton = container.querySelector("button");

    expect(textarea).not.toBeNull();
    expect(addButton).not.toBeNull();

    act(() => {
      textarea.value = "   ";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      addButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const postCalls = fetchMock.mock.calls.filter(([, options = {}]) => {
      return options.method === "POST" && String(options.body || "").includes("task_id");
    });

    expect(postCalls.length).toBe(0);
  });
});
