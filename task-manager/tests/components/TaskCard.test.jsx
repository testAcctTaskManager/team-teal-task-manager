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

// Mock UsersContext so TaskCard can render human-readable user labels
vi.mock("../../src/contexts/UsersContext.jsx", () => {
  return {
    useUsers: () => ({
      users: [
        { id: 1, display_name: "Reporter One", email: "reporter@example.com" },
        { id: 2, display_name: "Assignee Two", email: "assignee@example.com" },
      ],
      loading: false,
      error: null,
      currentUser: null,
      setCurrentUser: () => {},
      refetch: () => {},
    }),
  };
});

// Mock UsersContext so TaskCard can render human-readable user labels
vi.mock("../../src/contexts/UsersContext.jsx", () => {
  return {
    useUsers: () => ({
      users: [
        { id: 1, display_name: "Reporter One", email: "reporter@example.com" },
        { id: 2, display_name: "Assignee Two", email: "assignee@example.com" },
      ],
      loading: false,
      error: null,
      currentUser: null,
      setCurrentUser: () => {},
      refetch: () => {},
    }),
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

    const card = container.querySelector('[testid="task-card"]');
    expect(card).not.toBeNull();

    expect(card.querySelector('[testid="task-card__title"]').textContent).toContain(
      "Example Task",
    );

    expect(card.textContent).toContain("Assignee");
    expect(card.textContent).toContain("Assignee Two");
    expect(card.textContent).toContain("Assignee Two");
    expect(card.textContent).toContain("Reporter");
    expect(card.textContent).toContain("Reporter One");
  });

  it("does not render a description even when provided", () => {
    expect(card.textContent).toContain("Reporter One");
  });

  it("does not render a description even when provided", () => {
    const task = {
      id: 2,
      title: "No description on card",
      description: "This should not appear on the card",
      title: "No description on card",
      description: "This should not appear on the card",
      start_date: null,
      due_date: null,
    };

    const { container } = renderTaskCard(task);
    const descriptionEl = container.querySelector('[testid="task-card__description"]');
    expect(descriptionEl).toBeNull();
    expect(container.textContent).not.toContain("This should not appear on the card");
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
    const dueEl = container.querySelector('[testid="task-card-due"]');
    expect(dueEl).not.toBeNull();
    expect(dueEl.className).toContain("m-0 text-[#ff6b6b]");
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
    const card = container.querySelector('[testid="task-card"]');
    expect(card).not.toBeNull();

    await click(card);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/task/123");
  });
});
