import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TaskCard from "../../src/components/TaskCard.jsx";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";

const navigateMock = vi.fn();

// Mock react-router-dom's useNavigate so we can assert navigation calls
vi.mock("react-router-dom", () => {
  return {
    useNavigate: () => navigateMock,
  };
});

function renderTaskCard(task, index = 0) {
  return renderWithRoot(<TaskCard task={task} index={index} />, {
    withDragDrop: true,
  });
}

describe("TaskCard", () => {
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    navigateMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
  });

  it("returns null when task or task.id is missing", () => {
    const { container } = renderTaskCard(null);
    expect(container.querySelector(".task-card")).toBeNull();

    const { container: container2 } = renderTaskCard({});
    expect(container2.querySelector(".task-card")).toBeNull();
  });

  it("renders basic task information", () => {
    const task = {
      id: 123,
      title: "Example Task",
      description: "A simple task description",
      start_date: "2025-01-01T00:00:00.000Z",
      due_date: "2099-01-10T00:00:00.000Z",
      sprint_id: 7,
      reporter_id: 1,
      assignee_id: 2,
    };

    const { container } = renderTaskCard(task);

    const card = container.querySelector(".task-card");
    expect(card).not.toBeNull();

    expect(card.querySelector(".task-card__title").textContent).toContain(
      "Example Task",
    );

    expect(card.textContent).toContain("ID");
    expect(card.textContent).toContain("123");
    expect(card.textContent).toContain("Sprint");
    expect(card.textContent).toContain("7");
    expect(card.textContent).toContain("Assignee");
    expect(card.textContent).toContain("2");
    expect(card.textContent).toContain("Reporter");
    expect(card.textContent).toContain("1");
  });

  it("truncates long descriptions to 120 characters", () => {
    const longDescription = "x".repeat(150);
    const task = {
      id: 1,
      title: "With long description",
      description: longDescription,
      start_date: null,
      due_date: null,
    };

    const { container } = renderTaskCard(task);
    const descriptionEl = container.querySelector(".task-card__description");
    expect(descriptionEl).not.toBeNull();
    expect(descriptionEl.textContent.length).toBeLessThanOrEqual(120);
    expect(descriptionEl.textContent.endsWith("...")).toBe(true);
  });

  it("does not truncate short descriptions", () => {
    const description = "Short description that should not be truncated.";
    const task = {
      id: 2,
      title: "Short description",
      description,
      start_date: null,
      due_date: null,
    };

    const { container } = renderTaskCard(task);
    const descriptionEl = container.querySelector(".task-card__description");
    expect(descriptionEl).not.toBeNull();
    expect(descriptionEl.textContent).toBe(description);
  });

  it("shows overdue class when due date is in the past", () => {
    // Use a clearly past date
    const task = {
      id: 1,
      title: "Overdue task",
      description: "",
      start_date: null,
      due_date: "2000-01-01T00:00:00.000Z",
    };

    const { container } = renderTaskCard(task);
    const dueEl = container.querySelector(".task-card__due");
    expect(dueEl).not.toBeNull();
    expect(dueEl.className).toContain("task-card__overdue");
  });

  it("does not mark future due dates as overdue", () => {
    const task = {
      id: 3,
      title: "Future task",
      description: "",
      start_date: null,
      due_date: "2999-01-01T00:00:00.000Z",
    };

    const { container } = renderTaskCard(task);
    const dueEl = container.querySelector(".task-card__due");
    if (dueEl) {
      expect(dueEl.className).not.toContain("task-card__overdue");
    }
  });

  it("navigates to task details when card is clicked", async () => {
    const task = {
      id: 123,
      title: "Clickable task",
      description: "",
      start_date: null,
      due_date: null,
    };

    const { container } = renderTaskCard(task);
    const card = container.querySelector(".task-card");
    expect(card).not.toBeNull();

    await click(card);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/task/123");
  });
});
