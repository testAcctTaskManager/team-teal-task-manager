import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import TaskForm from "../../src/components/TaskForm.jsx";
import { renderWithRoot, click, input } from "../test-utils/reactTestUtils.jsx";
import { UsersProvider } from "../../src/contexts/UsersContext.jsx";

function renderTaskForm(props = {}) {
  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const { container, root } = renderWithRoot(
    <UsersProvider>
      <TaskForm
        projectId={1}
        columnId={props.columnId ?? null}
        taskId={props.taskId ?? null}
        columnsForStatus={props.columnsForStatus ?? []}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </UsersProvider>,
  );

  return { container, root, onSuccess, onCancel };
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("TaskForm (Vitest)", () => {
  let originalFetch;
  let fetchMock;
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalFetch = global.fetch;
    fetchMock = vi.fn(async (url) => {
      if (url === "/api/auth/me") {
        return {
          ok: true,
          json: async () => ({ id: 1, display_name: "Default User" }),
        };
      }

      if (url === "/api/users") {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Default User" }],
        };
      }

      if (url === "/api/tasks" || String(url).startsWith("/api/tasks/")) {
        return {
          ok: true,
          json: async () => ({ id: 1, title: "Created via test" }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("validates required title before submit and does not call fetch", async () => {
    const { container } = renderTaskForm();

    const submitButton = container.querySelector("button[type='submit']");
    expect(submitButton).not.toBeNull();

    await click(submitButton);

    expect(container.textContent).toContain("This field is required");
    // UsersProvider will fetch /api/users on mount, but submitting an
    // invalid form should not trigger the task API.
    expect(fetchMock).not.toHaveBeenCalledWith("/api/tasks");
  });

  it("invokes onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const { container } = renderTaskForm({ onCancel });

    const cancelButton = Array.from(
      container.querySelectorAll("button"),
    ).find((btn) => btn.textContent.includes("Cancel"));

    expect(cancelButton).not.toBeNull();

    await click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses currentUser for modified_by and does not send created_by when editing a task", async () => {
    const taskId = 42;
    let updatedPayload = null;

    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") {
        return {
          ok: true,
          json: async () => ({ id: 7, display_name: "Test User" }),
        };
      }

      if (url === "/api/users") {
        return {
          ok: true,
          json: async () => [{ id: 7, display_name: "Test User" }],
        };
      }

      if (url === `/api/tasks/${taskId}` && (!options.method || options.method === "GET")) {
        return {
          ok: true,
          json: async () => ({
            id: taskId,
            title: "Existing Task",
            description: "Existing description",
            sprint_id: 1,
            reporter_id: 2,
            assignee_id: 3,
            start_date: "2025-01-01",
            due_date: "2025-01-10",
            created_by: 1,
          }),
        };
      }

      if (url === `/api/tasks/${taskId}` && options.method === "PUT") {
        const body = JSON.parse(options.body);
        updatedPayload = body;
        return {
          ok: true,
          json: async () => ({ id: taskId, ...body }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    const { container, onSuccess } = renderTaskForm({ taskId });

    await flushAsync();

    const titleInput = container.querySelector("input[name='title']");
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe("Existing Task");

    input(titleInput, "Updated Task Title");

    const submitButton = container.querySelector("button[type='submit']");
    expect(submitButton).not.toBeNull();

    await click(submitButton);
    await flushAsync();
    expect(onSuccess).toHaveBeenCalledTimes(1);

    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.modified_by).toBe(7);
    expect("created_by" in updatedPayload).toBe(false);
  });

  // ── Lines 108-109: load task for edit returns non-ok ──────────────────────
  it("shows error when loading existing task returns non-ok", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (String(url).startsWith("/api/tasks/")) return { ok: false, json: async () => ({ error: "not found" }) };
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm({ taskId: 99 });
    await flushAsync();

    expect(container.textContent).toContain("Unable to load task for editing.");
  });

  // ── Lines 119-120: load task for edit fetch throws ────────────────────────
  it("shows error when loading existing task throws a network error", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (String(url).startsWith("/api/tasks/")) throw new Error("Network failure");
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm({ taskId: 99 });
    await flushAsync();

    expect(container.textContent).toContain("Network error loading task for editing.");
  });

  // ── Lines 154-155: handleChange updates form state ────────────────────────
  it("updates form state when a field is changed", async () => {
    const { container } = renderTaskForm();
    await flushAsync();

    const titleInput = container.querySelector("input[name='title']");
    act(() => { fireEvent.change(titleInput, { target: { name: "title", value: "Changed Title" } }); });

    expect(titleInput.value).toBe("Changed Title");
  });

  // ── Line 169: due_date before start_date triggers validation error ─────────
  it("shows validation error when due date is before start date", async () => {
    const { container } = renderTaskForm();
    await flushAsync();

    act(() => {
      fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "My Task" } });
      fireEvent.change(container.querySelector("input[name='start_date']"), { target: { name: "start_date", value: "2025-06-01" } });
      fireEvent.change(container.querySelector("input[name='due_date']"), { target: { name: "due_date", value: "2025-05-01" } });
    });

    await click(container.querySelector("button[type='submit']"));

    expect(container.textContent).toContain("Due date must be on or after start date");
  });

  // ── Line 203: column_id included in payload when a column is selected ──────
  it("includes column_id in payload when a status column is selected", async () => {
    let capturedPayload = null;
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (url === "/api/tasks" && options?.method === "POST") {
        capturedPayload = JSON.parse(options.body);
        return { ok: true, json: async () => ({ id: 1, ...capturedPayload }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm({ columnsForStatus: [{ id: 5, name: "In Progress", title: "In Progress" }] });
    await flushAsync();

    act(() => {
      fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "Task" } });
      fireEvent.change(container.querySelector("select[name='column_id']"), { target: { name: "column_id", value: "5" } });
    });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.column_id).toBe(5);
  });

  // ── Line 211: created_by set from currentUser in create mode ──────────────
  it("includes created_by from currentUser when creating a task", async () => {
    let capturedPayload = null;
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 3, display_name: "Creator" }) };
      if (url === "/api/users") return { ok: true, json: async () => [{ id: 3, display_name: "Creator" }] };
      if (url === "/api/tasks" && options?.method === "POST") {
        capturedPayload = JSON.parse(options.body);
        return { ok: true, json: async () => ({ id: 1, ...capturedPayload }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    act(() => { fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "New Task" } }); });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.created_by).toBe(3);
  });

  // ── Lines 220-224: edit task PUT returns non-ok ───────────────────────────
  it("shows error message when edit task PUT returns non-ok", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (String(url).startsWith("/api/tasks/") && (!options?.method || options.method === "GET")) {
        return { ok: true, json: async () => ({ id: 42, title: "Existing" }) };
      }
      if (String(url).startsWith("/api/tasks/") && options?.method === "PUT") {
        return { ok: false, json: async () => ({ error: "Update failed" }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm({ taskId: 42 });
    await flushAsync();

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(container.textContent).toContain("Update failed");
  });

  // ── Lines 228-236: create task POST returns non-ok ────────────────────────
  it("shows error message when create task POST returns non-ok", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (url === "/api/tasks" && options?.method === "POST") {
        return { ok: false, json: async () => ({ error: "Create failed" }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    act(() => { fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "New Task" } }); });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(container.textContent).toContain("Create failed");
  });

  // ── Lines 80-86 + 242: successful create resets form, keeps columnId ───────
  it("resets form after successful task creation and keeps columnId", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (url === "/api/tasks" && options?.method === "POST") {
        return { ok: true, json: async () => ({ id: 1, title: "New Task" }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container, onSuccess } = renderTaskForm({
      columnId: 7,
      columnsForStatus: [{ id: 7, name: "Sprint Column", title: "Sprint Column" }],
    });
    await flushAsync();

    act(() => { fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "New Task" } }); });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    // Form title resets to empty
    expect(container.querySelector("input[name='title']").value).toBe("");
    // column_id select resets to the provided columnId
    expect(container.querySelector("select[name='column_id']").value).toBe("7");
  });

  // ── Lines 254-255: fetch throws on submit ─────────────────────────────────
  it("shows network error message when fetch throws during task save", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (url === "/api/tasks") throw new Error("Network failure");
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    act(() => { fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "New Task" } }); });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(container.textContent).toContain("Network error while saving task.");
  });

  // ── Line 222: edit PUT error body has no .error field → fallback message ──
  it("shows fallback error message when edit PUT response has no error field", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (String(url).startsWith("/api/tasks/") && (!options?.method || options.method === "GET")) {
        return { ok: true, json: async () => ({ id: 42, title: "Existing" }) };
      }
      if (String(url).startsWith("/api/tasks/") && options?.method === "PUT") {
        return { ok: false, json: async () => ({}) }; // no .error field
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm({ taskId: 42 });
    await flushAsync();

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(container.textContent).toContain("Unable to save task (API not ready or error).");
  });

  // ── Line 232: create POST error body has no .error field → fallback message
  it("shows fallback error message when create POST response has no error field", async () => {
    fetchMock.mockImplementation(async (url, options = {}) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: true, json: async () => [] };
      if (url === "/api/tasks" && options?.method === "POST") {
        return { ok: false, json: async () => ({}) }; // no .error field
      }
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    act(() => { fireEvent.change(container.querySelector("input[name='title']"), { target: { name: "title", value: "New Task" } }); });

    await click(container.querySelector("button[type='submit']"));
    await flushAsync();

    expect(container.textContent).toContain("Unable to save task (API not ready or error).");
  });

  // ── Lines 343-344, 367-368: usersError shown; 354-356, 378-380: user options rendered ──
  it("shows usersError in reporter and assignee dropdowns and renders user options", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "User" }) };
      if (url === "/api/users") return { ok: false, json: async () => ({ error: "Unable to load users." }) };
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    // Both reporter and assignee sections show the error
    const errors = Array.from(container.querySelectorAll(".text-red-400"));
    const userErrors = errors.filter((el) => el.textContent.includes("Unable to load users."));
    expect(userErrors.length).toBe(2);
  });

  it("renders user options with display_name, email fallback, and User X fallback", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/auth/me") return { ok: true, json: async () => ({ id: 1, display_name: "Alice" }) };
      if (url === "/api/users") return {
        ok: true,
        json: async () => [
          { id: 1, display_name: "Alice" },
          { id: 2, email: "bob@example.com" },
          { id: 3 },
        ],
      };
      return { ok: true, json: async () => ({}) };
    });

    const { container } = renderTaskForm();
    await flushAsync();

    const reporterSelect = container.querySelector("select#reporter_id");
    expect(reporterSelect.textContent).toContain("Alice");
    expect(reporterSelect.textContent).toContain("bob@example.com");
    expect(reporterSelect.textContent).toContain("User 3");
  });

  // ── Line 397: column option uses `Column ${col.id}` when no title or name ─
  it("renders column option with 'Column X' fallback when col has no title or name", async () => {
    const { container } = renderTaskForm({
      columnsForStatus: [{ id: 9 }], // no title, no name
    });
    await flushAsync();

    const columnSelect = container.querySelector("select[name='column_id']");
    expect(columnSelect.textContent).toContain("Column 9");
  });
});
