import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@hello-pangea/dnd", () => ({
  Droppable: ({ children }) =>
    children({
      innerRef: () => {},
      droppableProps: {},
      placeholder: <div data-testid="drop-placeholder" />,
    }),
}));

vi.mock("../../src/components/TaskCard.jsx", () => ({
  default: ({ task }) => <div data-testid="task-card">{task.title}</div>,
}));

import KanbanColumn from "../../src/components/KanbanColumn.jsx";

describe("KanbanColumn", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders tasks when provided", () => {
    render(
      <KanbanColumn
        title="To Do"
        colIndex={0}
        tasks={[
          { id: 1, title: "A" },
          { id: 2, title: "B" },
        ]}
      />,
    );

    expect(screen.getByText("To Do")).toBeTruthy();
    expect(screen.getAllByTestId("task-card")).toHaveLength(2);
  });

  it("renders empty state when there are no tasks", () => {
    render(<KanbanColumn title="Done" colIndex={1} tasks={[]} />);

    expect(screen.getByText("No Tasks")).toBeTruthy();
    expect(screen.getByTestId("drop-placeholder")).toBeTruthy();
  });
});
