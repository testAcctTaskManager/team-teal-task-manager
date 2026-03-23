import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Sprints from "../../src/components/Sprints.jsx";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";

// Mock Board so we don't need to set up DragDropContext or real columns
vi.mock("../../src/components/Board.jsx", () => {
  return {
    default: ({ columns, boardTitle, emptyColumnsText }) => (
      <div data-testid="mock-board">
        <span data-testid="board-title">{boardTitle}</span>
        {columns.length === 0 && (
          <p data-testid="empty-text">{emptyColumnsText}</p>
        )}
        {columns.map((col, i) => (
          <div key={i} data-testid="board-column">{col.title}</div>
        ))}
      </div>
    ),
  };
});

const testColumns = [
  {
    id: 1,
    title: "To Do",
    tasks: [{ id: 50, title: "API Integration", position: 0, column_id: 1 }],
  },
];

function renderSprints(props = {}) {
  return renderWithRoot(<Sprints {...props} />);
}

describe("Sprints", () => {
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
  });

  // Button text

  it("shows 'Create New Sprint' button when no sprint exists", () => {
    const { container } = renderSprints({ sprintName: null, sprintStatus: null });
    expect(container.querySelector("button").textContent).toBe("Create New Sprint");
  });

  it("shows 'Start Sprint' button when sprint status is not_started", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "not_started",
    });
    expect(container.querySelector("button").textContent).toBe("Start Sprint");
  });

  it("shows 'Complete Sprint' button when sprint status is in_progress", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "in_progress",
    });
    expect(container.querySelector("button").textContent).toBe("Complete Sprint");
  });

  //  Sprint name and status label display 

  it("renders the sprint name when provided", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "not_started",
    });
    expect(container.textContent).toContain("Sprint 1");
  });

  it("does not render a sprint name when none is provided", () => {
    const { container } = renderSprints({ sprintName: null, sprintStatus: null });
    // No name span should be rendered
    expect(container.querySelector(".font-semibold")).toBeNull();
  });

  it("renders 'Not Started' status label for not_started sprint", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "not_started",
    });
    expect(container.textContent).toContain("Not Started");
  });

  it("renders 'In Progress' status label for in_progress sprint", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "in_progress",
    });
    expect(container.textContent).toContain("In Progress");
  });

  it("renders 'Complete' status label for complete sprint", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "complete",
    });
    expect(container.textContent).toContain("Complete");
  });

  it("does not render a status label when no sprint name is set", () => {
    const { container } = renderSprints({ sprintName: null, sprintStatus: null });
    expect(container.textContent).not.toContain("Not Started");
    expect(container.textContent).not.toContain("In Progress");
  });

  // Button click handlers 

  it("calls createSprint when 'Create New Sprint' is clicked", async () => {
    const createSprint = vi.fn();
    const { container } = renderSprints({
      sprintName: null,
      sprintStatus: null,
      createSprint,
    });
    await click(container.querySelector("button"));
    expect(createSprint).toHaveBeenCalledTimes(1);
  });

  it("calls updateSprintStatus and setSprintStatus with 'in_progress' when 'Start Sprint' is clicked", async () => {
    const updateSprintStatus = vi.fn();
    const setSprintStatus = vi.fn();
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "not_started",
      updateSprintStatus,
      setSprintStatus,
    });
    await click(container.querySelector("button"));
    expect(updateSprintStatus).toHaveBeenCalledWith("in_progress");
    expect(setSprintStatus).toHaveBeenCalledWith("in_progress");
  });

  it("calls updateSprintStatus and setSprintStatus with 'complete' when 'Complete Sprint' is clicked", async () => {
    const updateSprintStatus = vi.fn();
    const setSprintStatus = vi.fn();
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "in_progress",
      updateSprintStatus,
      setSprintStatus,
    });
    await click(container.querySelector("button"));
    expect(updateSprintStatus).toHaveBeenCalledWith("complete");
    expect(setSprintStatus).toHaveBeenCalledWith("complete");
  });

  it("does nothing when the button is clicked on a complete sprint", async () => {
    const updateSprintStatus = vi.fn();
    const setSprintStatus = vi.fn();
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "complete",
      updateSprintStatus,
      setSprintStatus,
    });
    await click(container.querySelector("button"));
    expect(updateSprintStatus).not.toHaveBeenCalled();
    expect(setSprintStatus).not.toHaveBeenCalled();
  });

  // ── Board integration ───────────────────────────────────────────────────────

  it("renders Board with the provided columns", () => {
    const { container } = renderSprints({
      sprintName: "Sprint 1",
      sprintStatus: "not_started",
      columns: testColumns,
    });
    expect(container.querySelectorAll('[data-testid="board-column"]').length).toBe(1);
    expect(container.textContent).toContain("To Do");
  });

  it("renders Board with the 'No Sprints' empty state when columns is empty", () => {
    const { container } = renderSprints({ columns: [] });
    expect(container.querySelector('[data-testid="empty-text"]').textContent).toBe(
      "No Sprints"
    );
  });

  it("passes boardTitle to Board", () => {
    const { container } = renderSprints({
      boardTitle: "My Custom Sprint Board",
      columns: [],
    });
    expect(container.querySelector('[data-testid="board-title"]').textContent).toBe(
      "My Custom Sprint Board"
    );
  });

  it("uses 'Sprint' as the default boardTitle", () => {
    const { container } = renderSprints({ columns: [] });
    expect(container.querySelector('[data-testid="board-title"]').textContent).toBe(
      "Sprint"
    );
  });
});
