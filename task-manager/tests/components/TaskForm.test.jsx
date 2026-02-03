import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import TaskForm from "../../src/components/TaskForm.jsx";

// Enable React act() support in this test environment
// eslint-disable-next-line no-undef
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderTaskForm(props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  act(() => {
    root.render(
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
  });

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

  it("validates required title before submit and does not call fetch", () => {
    const { container } = renderTaskForm();

    const submitButton = container.querySelector("button[type='submit']");
    expect(submitButton).not.toBeNull();

    act(() => {
      submitButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("This field is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invokes onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    const { container } = renderTaskForm({ onCancel });

    const cancelButton = Array.from(
      container.querySelectorAll("button"),
    ).find((btn) => btn.textContent.includes("Cancel"));

    expect(cancelButton).not.toBeNull();

    act(() => {
      cancelButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
