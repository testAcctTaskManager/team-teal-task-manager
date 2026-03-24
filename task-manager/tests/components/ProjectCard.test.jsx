import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ProjectCard from "../../src/components/ProjectCard.jsx";

describe("ProjectCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing for invalid project", () => {
    const { container } = render(<ProjectCard project={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders project name and handles click", () => {
    const onClick = vi.fn();
    render(
      <ProjectCard
        project={{ id: 1, name: "Project One" }}
        isSelected={false}
        onClick={onClick}
      />,
    );

    const card = screen.getByTestId("project-card");
    expect(card.textContent).toContain("Project One");

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
