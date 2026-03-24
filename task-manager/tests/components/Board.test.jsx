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
  default: ({ title, tasks, fullWidth, onAddToSprint }) => (
    <div
      data-testid="kanban-column"
      data-full-width={String(Boolean(fullWidth))}
      data-has-add-handler={String(typeof onAddToSprint === "function")}
    >
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

  it("supports vertical layout and passes column props", () => {
    const onAddToSprint = vi.fn();
    const { container } = render(
      <Board
        boardTitle="Clinical"
        layout="vertical"
        fullWidthColumns
        onAddToSprint={onAddToSprint}
        columns={[{ id: 1, title: "To Do", tasks: [] }]}
      />,
    );

    expect(screen.getByText("Clinical")).toBeTruthy();
    expect(container.querySelector(".flex-col.gap-4")).toBeTruthy();
    expect(screen.getByTestId("kanban-column").getAttribute("data-full-width")).toBe("true");
    expect(
      screen.getByTestId("kanban-column").getAttribute("data-has-add-handler"),
    ).toBe("true");
  });

  it("reverts task positions and alerts when persistence fails", async () => {
    const setColumns = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });

    const originalColumns = [
      {
        id: 1,
        title: "A",
        tasks: [
          { id: 11, position: 0 },
          { id: 12, position: 1 },
        ],
      },
      { id: 2, title: "B", tasks: [] },
    ];

    render(<Board columns={originalColumns} setColumns={setColumns} />);

    dnd.onDragEnd({
      source: { droppableId: "0", index: 1 },
      destination: { droppableId: "1", index: 0 },
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Failed to move task. You may not have permission to make this change.",
      );
    });

    expect(setColumns).toHaveBeenCalledTimes(2);
    expect(setColumns).toHaveBeenNthCalledWith(1, expect.any(Array));
    expect(setColumns).toHaveBeenNthCalledWith(2, expect.any(Function));

    const revertUpdater = setColumns.mock.calls[1][0];
    const optimisticState = setColumns.mock.calls[0][0];
    const reverted = revertUpdater(optimisticState);

    expect(reverted[0].tasks.map((task) => task.id)).toEqual([11, 12]);
    expect(reverted[0].tasks[0].position).toBe(0);
    expect(reverted[0].tasks[1].position).toBe(1);
    expect(reverted[1].tasks).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("skips persistence when a move generates no update payloads", async () => {
    const setColumns = vi.fn();
    global.fetch = vi.fn();

    render(
      <Board
        columns={[
          { id: undefined, title: "A", tasks: [{ position: 0 }] },
          { id: undefined, title: "B", tasks: [] },
        ]}
        setColumns={setColumns}
      />,
    );

    dnd.onDragEnd({
      source: { droppableId: "0", index: 0 },
      destination: { droppableId: "1", index: 0 },
    });

    await waitFor(() => {
      expect(setColumns).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });
});
