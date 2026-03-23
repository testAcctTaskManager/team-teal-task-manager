import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

const dnd = vi.hoisted(() => ({
  onDragEnd: null,
}));

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ onDragEnd, children }) => {
    dnd.onDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
}));

vi.mock("../../src/components/KanbanColumn.jsx", () => ({
  default: ({ title, tasks }) => (
    <div data-testid="kanban-column">
      {title}:{tasks.length}
    </div>
  ),
}));

import Board from "../../src/components/Board.jsx";

describe("Board", () => {
  let originalFetch;
  let originalAlert;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalAlert = global.alert;
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    global.alert = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    global.alert = originalAlert;
    vi.restoreAllMocks();
  });

  it("shows empty text when there are no columns", () => {
    render(<Board columns={[]} emptyColumnsText="Nothing here" />);

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("renders all columns when provided", () => {
    render(
      <Board
        columns={[
          { id: 1, title: "To Do", tasks: [{ id: 1, position: 0 }] },
          { id: 2, title: "Done", tasks: [] },
        ]}
      />,
    );

    expect(screen.getByText("To Do:1")).toBeTruthy();
    expect(screen.getByText("Done:0")).toBeTruthy();
  });

  it("ignores no-op drag events", async () => {
    const setColumns = vi.fn();
    render(
      <Board
        columns={[{ id: 1, title: "Only", tasks: [{ id: 1, position: 0 }] }]}
        setColumns={setColumns}
      />,
    );

    dnd.onDragEnd({ source: { droppableId: "0", index: 0 }, destination: null });
    dnd.onDragEnd({
      source: { droppableId: "0", index: 0 },
      destination: { droppableId: "0", index: 0 },
    });

    await waitFor(() => {
      expect(setColumns).not.toHaveBeenCalled();
    });
  });

  it("moves tasks and persists updates when drag ends", async () => {
    const setColumns = vi.fn();
    const columns = [
      { id: 1, title: "A", tasks: [{ id: 11, position: 0 }] },
      { id: 2, title: "B", tasks: [{ id: 22, position: 0 }] },
    ];

    render(<Board columns={columns} setColumns={setColumns} />);

    dnd.onDragEnd({
      source: { droppableId: "0", index: 0 },
      destination: { droppableId: "1", index: 1 },
    });

    await waitFor(() => {
      expect(setColumns).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/tasks/11",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
