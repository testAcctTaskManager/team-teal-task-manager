import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import OldSprints from "../../src/components/OldSprints.jsx";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../../src/contexts/UsersContext.jsx", () => ({
  useUsers: () => ({
    users: [
      { id: 1, display_name: "Alice Developer", email: "alice@example.com" },
      { id: 2, display_name: "Bob Tester", email: "bob@example.com" },
    ],
  }),
}));

const completedSprints = [
  { id: 1, name: "Sprint 1", status: "complete" },
  { id: 2, name: "Sprint 2", status: "complete" },
];

const allTasks = [
  { id: 10, title: "Write tests", sprint_id: 1, assignee_id: 1, due_date: "2026-01-10" },
  { id: 11, title: "Fix login bug", sprint_id: 1, assignee_id: 2, due_date: null },
  { id: 12, title: "Design UI", sprint_id: 2, assignee_id: 1, due_date: "2026-02-15" },
];

function renderOldSprints(props = {}) {
  return renderWithRoot(
    <OldSprints sprints={completedSprints} allTasks={allTasks} {...props} />
  );
}

describe("OldSprints", () => {
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    navigateMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
  });

  // Empty states

  it("shows empty state when there are no sprints", () => {
    const { container } = renderOldSprints({ sprints: [] });
    expect(container.textContent).toContain("No completed sprints yet.");
  });

  it("shows empty state when all sprints are not yet complete", () => {
    const activeSprints = [
      { id: 1, name: "Sprint 1", status: "in_progress" },
      { id: 2, name: "Sprint 2", status: "not_started" },
    ];
    const { container } = renderOldSprints({ sprints: activeSprints });
    expect(container.textContent).toContain("No completed sprints yet.");
  });

  // Sprint rendering 

  it("renders a completed sprint's name", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    expect(container.textContent).toContain("Sprint 1");
  });

  it("renders all completed sprints", () => {
    const { container } = renderOldSprints();
    expect(container.textContent).toContain("Sprint 1");
    expect(container.textContent).toContain("Sprint 2");
  });

  it("renders sprints in reverse order (most recent first)", () => {
    const { container } = renderOldSprints();
    const headings = Array.from(container.querySelectorAll("h2"));
    expect(headings[0].textContent).toBe("Sprint 2");
    expect(headings[1].textContent).toBe("Sprint 1");
  });

  it("does not render non-complete sprints", () => {
    const mixed = [
      { id: 1, name: "Done Sprint", status: "complete" },
      { id: 2, name: "Active Sprint", status: "in_progress" },
    ];
    const { container } = renderOldSprints({ sprints: mixed });
    expect(container.textContent).toContain("Done Sprint");
    expect(container.textContent).not.toContain("Active Sprint");
  });

  //  Task count label

  it("shows plural 'tasks' count in the sprint header", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    expect(container.textContent).toContain("2 tasks");
  });

  it("shows singular 'task' for a sprint with exactly one task", () => {
    const singleTask = [{ id: 10, title: "Write tests", sprint_id: 1, assignee_id: 1, due_date: null }];
    const { container } = renderOldSprints({
      sprints: [completedSprints[0]],
      allTasks: singleTask,
    });
    expect(container.textContent).toContain("1 task");
    expect(container.textContent).not.toContain("1 tasks");
  });

  it("shows '0 tasks' for a sprint with no tasks", () => {
    const { container } = renderOldSprints({
      sprints: [completedSprints[0]],
      allTasks: [],
    });
    expect(container.textContent).toContain("0 tasks");
  });

  // Task rendering 

  it("renders tasks belonging to a sprint", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    expect(container.textContent).toContain("Write tests");
    expect(container.textContent).toContain("Fix login bug");
  });

  it("does not render tasks from a different sprint", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    expect(container.textContent).not.toContain("Design UI");
  });

  it("shows empty state inside sprint when it has no tasks", () => {
    const { container } = renderOldSprints({
      sprints: [completedSprints[0]],
      allTasks: [],
    });
    expect(container.textContent).toContain("No tasks completed in this sprint.");
  });

  it("shows the assignee name on a task", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    // task id 10 has assignee_id 1 → "Alice Developer"
    expect(container.textContent).toContain("Alice Developer");
  });

  it("shows no assignee when task has no assignee_id", () => {
    const unassigned = [{ id: 20, title: "Unassigned Task", sprint_id: 1, assignee_id: null, due_date: null }];
    const { container } = renderOldSprints({
      sprints: [completedSprints[0]],
      allTasks: unassigned,
    });
    expect(container.textContent).toContain("Unassigned Task");
    expect(container.textContent).not.toContain("Alice Developer");
  });

  it("renders the due date when a task has one", () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    // task 10 has due_date "2026-01-10" — just check the "Due:" label appears
    expect(container.textContent).toContain("Due:");
  });

  it("does not render a due date row when task has no due_date", () => {
    const noDate = [{ id: 11, title: "Fix login bug", sprint_id: 1, assignee_id: 2, due_date: null }];
    const { container } = renderOldSprints({
      sprints: [completedSprints[0]],
      allTasks: noDate,
    });
    expect(container.textContent).not.toContain("Due:");
  });

  //  Navigation

  it("navigates to task detail when a task card is clicked", async () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    const taskCard = container.querySelector('[role="button"]');
    await click(taskCard);
    expect(navigateMock).toHaveBeenCalledWith("/task/10");
  });

  it("navigates to task detail when Enter is pressed on a task card", async () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    const taskCard = container.querySelector('[role="button"]');
    await act(async () => {
      taskCard.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith("/task/10");
  });

  it("navigates to task detail when Space is pressed on a task card", async () => {
    const { container } = renderOldSprints({ sprints: [completedSprints[0]] });
    const taskCard = container.querySelector('[role="button"]');
    await act(async () => {
      taskCard.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(navigateMock).toHaveBeenCalledWith("/task/10");
  });
});
