import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { act } from "react";
import ProjectSelector from "../../src/components/ProjectSelector.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

const mockProjects = [
  { id: 1, name: "Project One" },
  { id: 2, name: "Project Two" },
  { id: 3, name: "Project Three" },
];

function renderSelector(props = {}) {
  return renderWithRoot(<ProjectSelector {...props} />);
}

describe("ProjectSelector", () => {
  it("renders 'No Projects Available' when projects list is empty", () => {
    const { container } = renderSelector({ projects: [] });
    expect(container.textContent).toContain("No Projects Available");
  });

  it("calls onSelectProject with the correct id when a project card is clicked", async () => {
    const onSelectProject = vi.fn();
    const { container } = renderSelector({
      projects: mockProjects,
      selectedProjectId: 1,
      onSelectProject,
    });

    const btn = container.querySelector("button");
    await act(async () => {
      fireEvent.click(btn);
    });

    const cards = container.querySelectorAll("[data-testid='project-card']");
    await act(async () => {
      fireEvent.click(cards[1]);
    });

    expect(onSelectProject).toHaveBeenCalledWith(2);
  });

  it("renders null for a project card with no id", async () => {
    const projects = [{ id: null, name: "Ghost" }, { id: 1, name: "Real" }];
    const { container } = renderSelector({
      projects,
      selectedProjectId: 1,
      onSelectProject: vi.fn(),
    });

    const btn = container.querySelector("button");
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(container.querySelectorAll("[data-testid='project-card']").length).toBe(1);
  });
});