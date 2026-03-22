import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TaskDetail from "../../src/pages/TaskDetail.jsx";
import { UsersContext } from "../../src/contexts/UsersContext.jsx";
import { fireEvent } from "@testing-library/react";
import { renderWithRoot, click, input } from "../test-utils/reactTestUtils.jsx";

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Create test context then render TaskDetail component with this context
function renderTaskDetail(initialPath = "/task/42", users = [], currentUser = null) {
  const contextValue = {
    users,
    currentUser,
    isAuthenticated: !!currentUser,
    authLoading: false,
    loading: false,
    error: null,
    refetch: () => {},
    logout: () => {},
  };
  return renderWithRoot(
    <UsersContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </MemoryRouter>
    </UsersContext.Provider>,
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

  // ── Lines 83-84: task API returns non-ok ──────────────────────────────────
  it("shows error message when task API returns non-ok", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: false, json: async () => ({ error: "not found" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Unable to load task from server.");
  });

  // ── Lines 89-90: task fetch throws ────────────────────────────────────────
  it("shows error message when task fetch throws a network error", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) throw new Error("Network failure");
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Network error loading task.");
  });

  // ── Lines 111-113: comments API returns non-ok ────────────────────────────
  it("shows error message when comments API returns non-ok", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: false, json: async () => ({ error: "boom" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Unable to load comments from server.");
  });

  // ── Lines 118-120: comments fetch throws ─────────────────────────────────
  it("shows error message when comments fetch throws a network error", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) throw new Error("Network failure");
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Network error loading comments.");
  });

  // ── Lines 133-149: columns loaded for task project ────────────────────────
  it("loads columns for task project and uses them for status label", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 5, column_id: 10 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [{ id: 10, name: "In Progress" }] };
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 5, name: "My Project" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/columns?project_id=5"));
    expect(container.textContent).toContain("In Progress");
  });

  // ── Lines 137-138: columns API returns non-array body ────────────────────
  it("handles columns API returning a non-array response body", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 5, column_id: 10 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => ({ error: "bad" }) };
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 5, name: "Project" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    // Falls back to "Column X" since columnsForStatus ends up empty
    expect(container.textContent).toContain("Column 10");
  });

  // ── Lines 148-149: columns fetch throws a network error ───────────────────
  it("handles columns fetch throwing a network error", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 5, column_id: 10 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) throw new Error("Network failure");
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 5, name: "Project" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    // Falls back to "Column X" since columnsForStatus ends up empty
    expect(container.textContent).toContain("Column 10");
  });

  // ── Lines 154/156: no columns when task has no project_id ─────────────────
  it("does not fetch columns when task has no project_id", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const columnCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/columns"));
    expect(columnCalls.length).toBe(0);
  });

  // ── Lines 181-192: project name loaded and displayed ──────────────────────
  it("displays project name fetched from API", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 7 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 7, name: "Team Teal" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Team Teal");
  });

  // ── Lines 191-192: project name fetch throws a network error ─────────────
  it("handles project name fetch throwing a network error", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 7 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/projects/")) throw new Error("Network failure");
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    // Falls back to raw project_id since projectName stays null
    expect(container.textContent).toContain("7");
  });

  // ── Lines 184-186: project API returns error falls back to raw id ─────────
  it("falls back to project_id when project API returns non-ok", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 7 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/projects/")) return { ok: false, json: async () => ({ error: "not found" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("7");
  });

  // ── Lines 197: no project name fetched when task has no project_id ────────
  it("does not fetch project name when task has no project_id", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const projectCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/projects/"));
    expect(projectCalls.length).toBe(0);
  });

  // ── Lines 205-206: status label is "Backlog" when column_id is null ───────
  it("shows 'Backlog' status when task column_id is null", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 5, column_id: null }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 5, name: "Project" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Backlog");
  });

  // ── Lines 214-215: status label falls back to "Column X" when no match ────
  it("shows fallback 'Column X' when column_id does not match any loaded column", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", project_id: 5, column_id: 99 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (urlStr.startsWith("/api/columns")) return { ok: true, json: async () => [{ id: 10, name: "Done" }] };
      if (urlStr.startsWith("/api/projects/")) return { ok: true, json: async () => ({ id: 5, name: "Project" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Column 99");
  });

  // ── Lines 230-235: Edit Task button and description rendered ──────────────
  it("renders the Edit Task button and description", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "My Task", description: "Task description here" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const editBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Edit Task"));
    expect(editBtn).not.toBeNull();
    expect(container.textContent).toContain("Task description here");
  });

  // ── Lines 258-263: sprint_id rendered ─────────────────────────────────────
  it("displays sprint_id when present", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", sprint_id: 3 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Sprint");
    expect(container.textContent).toContain("3");
  });

  // ── Lines 266-277: assignee and reporter rendered with user lookup ─────────
  it("displays assignee and reporter display names from context", async () => {
    const users = [
      { id: 10, display_name: "Alice" },
      { id: 20, display_name: "Bob" },
    ];
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", assignee_id: 10, reporter_id: 20 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, users);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Assignee");
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Reporter");
    expect(container.textContent).toContain("Bob");
  });

  // ── Lines 14-19: UserWithTime shows "User X" when user not in context ─────
  it("shows 'User X' fallback when assignee is not found in users list", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", assignee_id: 99 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, []);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("User 99");
  });

  // ── Lines 17-18: UserWithTime prefers email when no display_name ──────────
  it("shows email when user has no display_name", async () => {
    const users = [{ id: 10, email: "alice@example.com" }];
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", assignee_id: 10 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, users);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("alice@example.com");
  });

  // ── Lines 300-315: created_at and updated_at dates rendered ───────────────
  it("displays created_at and updated_at when present", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return {
        ok: true,
        json: async () => ({ id: 42, title: "Task", created_at: "2025-01-15T00:00:00.000Z", updated_at: "2025-02-20T00:00:00.000Z" }),
      };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Created");
    expect(container.textContent).toContain("Updated");
  });

  // ── Lines 322-333: created_by and modified_by rendered ───────────────────
  it("displays created_by and modified_by when present", async () => {
    const users = [
      { id: 5, display_name: "Creator" },
      { id: 6, display_name: "Modifier" },
    ];
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task", created_by: 5, modified_by: 6 }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, users);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Created by");
    expect(container.textContent).toContain("Creator");
    expect(container.textContent).toContain("Modified By");
    expect(container.textContent).toContain("Modifier");
  });

  // ── Lines 349-361: existing comments rendered in list ─────────────────────
  it("renders existing comments", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return {
        ok: true,
        json: async () => [
          { id: 1, content: "First comment", created_by: "alice", created_at: "2025-01-01T00:00:00.000Z" },
          { id: 2, content: "Second comment", created_by: "bob", created_at: "2025-01-02T00:00:00.000Z" },
        ],
      };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("First comment");
    expect(container.textContent).toContain("Second comment");
  });

  // ── Lines 345-347: "No comments yet" shown when list is empty ─────────────
  it("shows 'No comments yet' when there are no comments", async () => {
    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("No comments yet.");
  });

  // ── Lines 376-399: successfully posting a comment ─────────────────────────
  it("posts a comment and appends it to the list", async () => {
    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const textarea = container.querySelector('[testid="comments-textbox"]');
    act(() => { fireEvent.change(textarea, { target: { value: "Hello comment" } }); });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent && btn.textContent.includes("Add Comment"),
    );
    await click(addButton);
    await act(async () => { await flushPromises(); });

    const postCalls = fetchMock.mock.calls.filter(([url, opts = {}]) => opts.method === "POST" && String(url) === "/api/comments");
    expect(postCalls.length).toBe(1);
    expect(container.textContent).toContain("Hello comment");
  });

  // ── Lines 391-394: comment POST returns error ─────────────────────────────
  it("shows error when posting a comment fails", async () => {
    fetchMock = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (method === "GET" && urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      if (method === "POST" && urlStr === "/api/comments") return { ok: false, json: async () => ({ error: "Server error" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const textarea = container.querySelector('[testid="comments-textbox"]');
    act(() => { fireEvent.change(textarea, { target: { value: "Bad comment" } }); });

    const addButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent && btn.textContent.includes("Add Comment"),
    );
    await click(addButton);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Server error");
  });

  // ── Lines 403-416: Edit modal opens and closes ────────────────────────────
  it("opens the edit modal when Edit Task is clicked", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const editBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Edit Task"));
    await click(editBtn);

    const cancelBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
    expect(cancelBtn).not.toBeNull();
  });

  it("closes the edit modal when Cancel is clicked", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`);
    await act(async () => { await flushPromises(); });

    const editBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Edit Task"));
    await click(editBtn);

    const cancelBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
    await click(cancelBtn);

    const cancelBtnAfter = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Cancel"));
    expect(cancelBtnAfter).toBeUndefined();
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

  // ── Local time line shown when commenter has a timezone ──────────────────
  it("shows 'Local time' line for a comment when the commenter has a timezone", async () => {
    const users = [{ id: 7, display_name: "Alice", timezone: "America/New_York" }];
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return {
        ok: true,
        json: async () => [
          { id: 1, content: "Hello", created_by: 7, created_at: "2025-06-15T14:00:00.000Z" },
        ],
      };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, users);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).toContain("Local time:");
  });

  it("does not show 'Local time' line when commenter has no timezone", async () => {
    const users = [{ id: 7, display_name: "Alice" }];
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.startsWith("/api/tasks/")) return { ok: true, json: async () => ({ id: 42, title: "Task" }) };
      if (urlStr.startsWith("/api/comments")) return {
        ok: true,
        json: async () => [
          { id: 1, content: "Hello", created_by: 7, created_at: "2025-06-15T14:00:00.000Z" },
        ],
      };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderTaskDetail(`/task/${taskId}`, users);
    await act(async () => { await flushPromises(); });

    expect(container.textContent).not.toContain("Local time:");
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
