import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TaskForm from "../../src/components/TaskForm.jsx";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";

function renderTaskForm(props = {}) {
  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const { container, root } = renderWithRoot(
    <TaskForm
      projectId={1}
      createdBy="alice"
      modifiedBy="alice"
      columnId={props.columnId ?? null}
      taskId={props.taskId ?? null}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  );

  return { container, root, onSuccess, onCancel };
}

describe("TaskForm (Vitest)", () => {
  let originalFetch;
  let fetchMock;
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalFetch = global.fetch;
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 1, title: "Created via test" }),
    }));
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
    expect(fetchMock).not.toHaveBeenCalled();
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
});
