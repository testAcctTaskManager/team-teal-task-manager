import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import Projects from "../../src/components/Projects.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

const mockProjects = [
  { id: 1, name: "Alpha Project", created_by: "Alice" },
  { id: 2, name: "Beta Project", created_by: "Bob" },
];

/**
 * Mounts the Projects onto the DOM
 * React will autorun its useEffect after it is mounted.
 * The useEffect calls load() which calls fetch("/api/projects").
 * All tests in this file intercept this fetch and the mock returns controlled data.
 */
function renderProjects() {
  return renderWithRoot(<Projects />);
}

describe("Projects", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
    const { container } = renderProjects();
    expect(container).not.toBeNull();
  });

  it("renders the 'Projects' heading", () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
    const { container } = renderProjects();
    expect(container.textContent).toContain("Projects");
  });

  it("calls fetch with /api/projects on mount", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => [] });
    global.fetch = fetchMock;
    renderProjects();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/projects");
    });
  });

  it("shows 'No projects found.' when API returns an empty array", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.textContent).toContain("No projects found.");
    });
  });

  it("renders a table with ID, Name, and Created By headers when projects exist", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => mockProjects });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.querySelector("table")).not.toBeNull();
      expect(container.textContent).toContain("ID");
      expect(container.textContent).toContain("Name");
      expect(container.textContent).toContain("Created By");
    });
  });

  it("renders a row for each project", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => mockProjects });
    const { container } = renderProjects();
    await waitFor(() => {
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
    });
  });

  it("displays the project id, name, and created_by in each row", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => mockProjects });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.textContent).toContain("Alpha Project");
      expect(container.textContent).toContain("Alice");
      expect(container.textContent).toContain("Beta Project");
      expect(container.textContent).toContain("Bob");
    });
  });

  it("shows '-' when project name is missing", async () => {
    const projects = [{ id: 3, name: null, created_by: "Carol" }];
    global.fetch = vi.fn().mockResolvedValue({ json: async () => projects });
    const { container } = renderProjects();
    await waitFor(() => {
      const cells = container.querySelectorAll("tbody td");
      expect(cells[1].textContent).toBe("-");
    });
  });

  it("shows '-' when created_by is missing", async () => {
    const projects = [{ id: 4, name: "No Owner", created_by: null }];
    global.fetch = vi.fn().mockResolvedValue({ json: async () => projects });
    const { container } = renderProjects();
    await waitFor(() => {
      const cells = container.querySelectorAll("tbody td");
      expect(cells[2].textContent).toBe("-");
    });
  });

  it("shows 'No projects found.' when the API returns a non-array", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ error: "bad" }) });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.textContent).toContain("No projects found.");
    });
  });

  it("shows 'No projects found.' when fetch throws an error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.textContent).toContain("No projects found.");
    });
  });

  it("shows 'No projects found.' when JSON parsing fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => { throw new Error("bad json"); } });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.textContent).toContain("No projects found.");
    });
  });

  it("does not render the table when there are no projects", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => [] });
    const { container } = renderProjects();
    await waitFor(() => {
      expect(container.querySelector("table")).toBeNull();
    });
  });
});
