import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import NewTaskButton from "../../src/components/NewTaskButton.jsx";

describe("NewTaskButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the button label", () => {
    render(<NewTaskButton />);

    expect(screen.getByRole("button", { name: "+ New Task" })).toBeTruthy();
  });

  it("calls openModal when clicked", () => {
    const openModal = vi.fn();
    render(<NewTaskButton openModal={openModal} />);

    fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));

    expect(openModal).toHaveBeenCalledTimes(1);
  });

  it("uses the default openModal handler when clicked without prop", () => {
    render(<NewTaskButton />);

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: "+ New Task" }));
    }).not.toThrow();
  });
});
