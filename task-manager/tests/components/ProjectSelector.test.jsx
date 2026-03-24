import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import ProjectSelector from "../../src/components/ProjectSelector.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

vi.mock("../../src/contexts/UsersContext.jsx", () => ({
  useUsers: () => ({ currentUser: { id: 42, display_name: "Test User" } }),
}));

const mockProjects = [
  { id: 1, name: "Project One" },
  { id: 2, name: "Project Two" },
  { id: 3, name: "Project Three" },
];

let cleanup;

function renderSelector(props = {}) {
  const result = renderWithRoot(<ProjectSelector {...props} />);
  cleanup = () => {
    if (result.container.parentNode) {
      result.container.parentNode.removeChild(result.container);
    }
  };
  return result;
}

describe("ProjectSelector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });
  it("renders 'No Projects Available' when projects list is empty", () => {
    const { container } = renderSelector({ projects: [] });
    expect(container.textContent).toContain("No Projects Available");
  });

  it("shows '+ New Project' button even when projects list is empty", async () => {
    const { container } = renderSelector({
      projects: [],
      onProjectCreated: vi.fn(),
    });

    expect(container.textContent).toContain("New Project");

    // Click it and verify the form opens
    const newBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent.includes("New Project"),
    );
    await act(async () => {
      fireEvent.click(newBtn);
    });

    expect(container.querySelector("#project-name")).toBeTruthy();
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

  it("shows '+ New Project' button in the dropdown", async () => {
    const { container } = renderSelector({
      projects: mockProjects,
      selectedProjectId: 1,
      onSelectProject: vi.fn(),
    });

    const btn = container.querySelector("button");
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(container.textContent).toContain("New Project");
  });

  it("opens project creation form when '+ New Project' is clicked", async () => {
    const { container } = renderSelector({
      projects: mockProjects,
      selectedProjectId: 1,
      onSelectProject: vi.fn(),
    });

    // Open the dropdown
    const toggleBtn = container.querySelector("button");
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // Click the New Project button
    const newBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent.includes("New Project"),
    );
    await act(async () => {
      fireEvent.click(newBtn);
    });

    // ProjectForm should now be rendered
    expect(container.querySelector("#project-name")).toBeTruthy();
    expect(container.textContent).toContain("Create Project");
  });

  it("calls onProjectCreated and selects new project after successful creation", async () => {
    const mockCreated = { id: 99, name: "Brand New" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCreated),
    });

    const onProjectCreated = vi.fn();
    const onSelectProject = vi.fn();
    const { container } = renderSelector({
      projects: mockProjects,
      selectedProjectId: 1,
      onSelectProject,
      onProjectCreated,
    });

    // Open dropdown and click New Project
    await act(async () => {
      fireEvent.click(container.querySelector("button"));
    });
    const newBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent.includes("New Project"),
    );
    await act(async () => {
      fireEvent.click(newBtn);
    });

    // Fill in the name and submit
    const input = container.querySelector("#project-name");
    await act(async () => {
      fireEvent.change(input, { target: { value: "Brand New" } });
    });
    const form = container.querySelector("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(onProjectCreated).toHaveBeenCalledWith(mockCreated);
    });

    // Form should be closed
    expect(container.querySelector("#project-name")).toBeFalsy();
  });
});