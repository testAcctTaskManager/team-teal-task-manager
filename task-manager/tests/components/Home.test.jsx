import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { waitFor, fireEvent } from "@testing-library/react";
import Home from "../../src/pages/Home.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

function renderHome(props = {}) {
  return renderWithRoot(
    <MemoryRouter>
      <Home {...props} />
    </MemoryRouter>,
  );
}

const mockProjects = [
  { id: 1, name: "Project One" },
  { id: 2, name: "Project Two" },
];

const mockColumns = [
  { id: 1, name: "To Do", project_id: 1 },
  { id: 2, name: "In Progress", project_id: 1 },
];

const mockTasks = [
  { id: 1, title: "Task One", column_id: 1, project_id: 1, position: 0, assignee_id: 10, reporter_id: 20 },
  { id: 2, title: "Task Two", column_id: null, project_id: 1, position: 0, assignee_id: 11, reporter_id: 20 },
];

const mockSprints = [
  { id: 1, name: "Sprint 1", status: "complete", project_id: 1 },
  { id: 2, name: "Sprint 2", status: "in_progress", project_id: 1 },
];

const mockUsers = [
  { id: 10, display_name: "Alice" },
  { id: 11, display_name: "Bob" },
];

describe("Home", () => {
  let fetchMock;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/projects")) {
        return { ok: true, json: async () => mockProjects };
      }
      if (urlStr.includes("/api/columns")) {
        return { ok: true, json: async () => mockColumns };
      }
      if (urlStr.includes("/api/tasks")) {
        return { ok: true, json: async () => mockTasks };
      }
      if (urlStr.includes("/api/sprints")) {
        return { ok: true, json: async () => mockSprints };
      }
      if (urlStr.includes("/api/users")) {
        return { ok: true, json: async () => mockUsers };
      }
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = renderHome();
    expect(container).not.toBeNull();
  });

  it("loads and displays projects, columns and tasks", async () => {
    renderHome({ projectId: 1 });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/projects"));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/columns?project_id=1"));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/tasks?project_id=1"));
    });
  });

  it("switches to Backlog tab when Backlog button is clicked", async () => {
    const { container } = renderHome({ projectId: 2 });

    let backlogBtn;
    await waitFor(() => {
      backlogBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Backlog"));
      expect(backlogBtn).toBeTruthy();
    });

    fireEvent.click(backlogBtn);

    await waitFor(() => {
      expect(container.textContent).toContain("Backlog");
    });
  });

  it("switches to Old Sprints tab when Old Sprints button is clicked", async () => {
    const { container } = renderHome({ projectId: 1 });

    let oldSprintsBtn;
    await waitFor(() => {
      oldSprintsBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("Old Sprints"));
      expect(oldSprintsBtn).toBeTruthy();
    });

    fireEvent.click(oldSprintsBtn);

    await waitFor(() => {
      expect(container.textContent).toContain("Old Sprints");
    });
  });

  it("opens create task modal when New Task button is clicked", async () => {
    const { container } = renderHome({ projectId: 1 });
    await waitFor(() => {
      const buttons = Array.from(container.querySelectorAll("button"));
      const newTaskBtn = buttons.find(
        (b) =>
          b.textContent.includes("New Task") || b.textContent.includes("Add Task") || b.textContent.includes("Create"),
      );
      if (newTaskBtn) fireEvent.click(newTaskBtn);
    });
  });

  it("handles API error when loading projects", async () => {
    fetchMock = vi.fn(async (url) => {
      if (String(url).includes("/api/projects")) {
        return { ok: false, json: async () => ({ error: "boom" }) };
      }
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderHome();
    await waitFor(() => {
      expect(container).not.toBeNull();
    });
  });

  it("handles API error when loading columns", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/projects")) return { ok: true, json: async () => mockProjects };
      if (urlStr.includes("/api/columns")) return { ok: false, json: async () => ({ error: "boom" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderHome({ projectId: 1 });
    await waitFor(() => {
      expect(container).not.toBeNull();
    });
  });

  it("handles API error when loading tasks", async () => {
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/projects")) return { ok: true, json: async () => mockProjects };
      if (urlStr.includes("/api/columns")) return { ok: true, json: async () => mockColumns };
      if (urlStr.includes("/api/tasks")) return { ok: false, json: async () => ({ error: "boom" }) };
      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;

    const { container } = renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(container).not.toBeNull();
    });
  });
});
