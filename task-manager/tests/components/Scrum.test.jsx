import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const spies = vi.hoisted(() => ({
  boardProps: vi.fn(),
}));

vi.mock("../../src/components/Board.jsx", () => ({
  default: (props) => {
    spies.boardProps(props);
    props.setColumns?.(props.columns);
    return <div data-testid="scrum-board">{props.boardTitle}</div>;
  },
}));

import Scrum from "../../src/components/Scrum.jsx";

describe("Scrum", () => {
  beforeEach(() => {
    spies.boardProps.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Board with scrum defaults", () => {
    const columns = [{ id: 1, title: "To Do", tasks: [] }];
    const setColumns = vi.fn();

    render(<Scrum columns={columns} setColumns={setColumns} />);

    expect(screen.getByTestId("scrum-board").textContent).toContain("Scrum Board");
    expect(spies.boardProps).toHaveBeenCalledWith(
      expect.objectContaining({
        columns,
        setColumns,
        boardTitle: "Scrum Board",
        emptyColumnsText: "No Columns",
        layout: "horizontal",
        fullWidthColumns: false,
      }),
    );
  });

  it("uses default columns and setColumns when no props are provided", () => {
    render(<Scrum />);

    expect(screen.getByTestId("scrum-board").textContent).toContain("Scrum Board");
    expect(spies.boardProps).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: [],
        boardTitle: "Scrum Board",
        emptyColumnsText: "No Columns",
        layout: "horizontal",
        fullWidthColumns: false,
      }),
    );
  });
});
