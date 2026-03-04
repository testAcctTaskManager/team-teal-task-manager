import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
});
