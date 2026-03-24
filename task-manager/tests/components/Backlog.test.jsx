import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const spies = vi.hoisted(() => ({
  boardProps: vi.fn(),
}));

vi.mock("../../src/components/Board.jsx", () => ({
  default: (props) => {
    spies.boardProps(props);
    return (
      <div data-testid="board-mock">
        {props.boardTitle}:{props.columns.length}
      </div>
    );
  },
}));

import Backlog from "../../src/components/Backlog.jsx";

describe("Backlog", () => {
  beforeEach(() => {
    spies.boardProps.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Board with backlog defaults", () => {
    const backlog = [{ id: null, title: "Backlog", tasks: [{ id: 1 }] }];

    render(<Backlog backlog={backlog} />);

    expect(screen.getByTestId("board-mock").textContent).toContain("Backlog:1");
    expect(spies.boardProps).toHaveBeenCalledWith(
      expect.objectContaining({
        boardTitle: "Backlog",
        emptyColumnsText: "No Backlog Sections",
        layout: "vertical",
        fullWidthColumns: true,
      }),
    );
  });

  it("passes onAddToSprint callback through to Board", () => {
    const onAddToSprint = vi.fn();

    render(<Backlog backlog={[]} onAddToSprint={onAddToSprint} />);

    expect(spies.boardProps).toHaveBeenCalledWith(
      expect.objectContaining({ onAddToSprint }),
    );
  });
});
