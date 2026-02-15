import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TaskDetail from "../../src/pages/TaskDetail.jsx";
import { renderWithRoot, click, input } from "../test-utils/reactTestUtils.jsx";

function renderTaskDetail(initialPath = "/task/42") {
  return renderWithRoot(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </MemoryRouter>,
  );
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

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent && btn.textContent.includes("Add Comment"),
    );
    expect(addButton).not.toBeNull();

    await click(addButton);

    const postCalls = fetchMock.mock.calls.filter(([, options = {}]) => {
      return (
        options.method === "POST" &&
        String(options.body || "").includes("task_id")
      );
    });

    expect(postCalls.length).toBe(0);
  });

  it("does not post comments that are only whitespace", async () => {
    const { container } = renderTaskDetail(`/task/${taskId}`);

    const textarea = container.querySelector('[testid="comments-textbox"]');
    const addButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent && btn.textContent.includes("Add Comment"),
    );

    expect(textarea).not.toBeNull();
    expect(addButton).not.toBeNull();

    input(textarea, "   ");

    await click(addButton);

    const postCalls = fetchMock.mock.calls.filter(([, options = {}]) => {
      return (
        options.method === "POST" &&
        String(options.body || "").includes("task_id")
      );
    });

    expect(postCalls.length).toBe(0);
  });
});
