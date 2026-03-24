import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { waitFor, fireEvent, screen } from "@testing-library/react";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

const spies = vi.hoisted(() => ({
  scrumProps: vi.fn(),
  backlogProps: vi.fn(),
  sprintsProps: vi.fn(),
  oldSprintsProps: vi.fn(),
  taskFormProps: vi.fn(),
  projectSelectorProps: vi.fn(),
}));

vi.mock("../../src/components/Scrum.jsx", () => ({
  default: (props) => {
    spies.scrumProps(props);
    const totalTasks = props.columns.reduce(
      (sum, col) => sum + col.tasks.length,
      0,
    );
    return <div data-testid="scrum-view">scrum:{totalTasks}</div>;
  },
}));

vi.mock("../../src/components/Backlog.jsx", () => ({
  default: (props) => {
    spies.backlogProps(props);
    return (
      <div data-testid="backlog-view">
        backlog:{props.backlog?.[0]?.tasks?.length ?? 0}
        <span data-testid="can-add">{String(Boolean(props.onAddToSprint))}</span>
        <button
          type="button"
          onClick={() => props.onAddToSprint?.(999)}
        >
          Add To Sprint
        </button>
      </div>
    );
  },
}));

vi.mock("../../src/components/Sprints.jsx", () => ({
  default: (props) => {
    spies.sprintsProps(props);
    return (
      <div data-testid="sprints-view">
        sprint:{props.sprintName ?? "none"}
        <button type="button" onClick={() => props.updateSprintStatus("in_progress")}>
          Start Sprint
        </button>
        <button type="button" onClick={() => props.updateSprintStatus("complete")}>
          Complete Sprint
        </button>
        <button type="button" onClick={props.createSprint}>
          Create Sprint
        </button>
      </div>
    );
  },
}));

vi.mock("../../src/components/OldSprints.jsx", () => ({
  default: (props) => {
    spies.oldSprintsProps(props);
    return <div data-testid="old-sprints-view">old-sprints</div>;
  },
}));

vi.mock("../../src/components/NewTaskButton.jsx", () => ({
  default: ({ openModal }) => (
    <button type="button" onClick={openModal}>
      New Task
    </button>
  ),
}));

vi.mock("../../src/components/TaskForm.jsx", () => ({
  default: (props) => {
    spies.taskFormProps(props);
    return (
      <div data-testid="task-form">
        <button type="button" onClick={() => props.onSuccess({ id: 123 })}>
          Save Task
        </button>
        <button type="button" onClick={props.onCancel}>
          Cancel Task
        </button>
      </div>
    );
  },
}));

vi.mock("../../src/components/ProjectSelector.jsx", () => ({
  default: (props) => {
    spies.projectSelectorProps(props);
    return (
      <div data-testid="project-selector">
        <button type="button" onClick={() => props.onSelectProject(2)}>
          Pick Project 2
        </button>
        <button
          type="button"
          onClick={() => props.onProjectCreated({ id: 7 })}
        >
          Create Project 7
        </button>
      </div>
    );
  },
}));

import Home from "../../src/pages/Home.jsx";

const mountedHomes = [];

function renderHome(props = {}) {
  const rendered = renderWithRoot(
    <MemoryRouter>
      <Home {...props} />
    </MemoryRouter>,
  );
  mountedHomes.push(rendered);
  return rendered;
}

const mockProjects = [
  { id: 1, name: "Project One" },
  { id: 2, name: "Project Two" },
  { id: 7, name: "Project Seven" },
];

const mockColumns = [
  { id: 1, key: "todo", name: "To Do", project_id: 1 },
  { id: 2, key: "complete", name: "Complete", project_id: 1 },
];

const mockTasks = [
  {
    id: 1,
    title: "Task One",
    column_id: 1,
    project_id: 1,
    sprint_id: 2,
    position: 0,
    assignee_id: 10,
    reporter_id: 20,
  },
  {
    id: 2,
    title: "Task Two",
    column_id: null,
    project_id: 1,
    sprint_id: null,
    position: 0,
    assignee_id: 11,
    reporter_id: 21,
  },
  {
    id: 3,
    title: "Task Three",
    column_id: null,
    project_id: 1,
    sprint_id: 2,
    position: 1,
    assignee_id: 11,
    reporter_id: 20,
  },
  {
    id: 4,
    title: "Task Four",
    column_id: 1,
    project_id: 1,
    sprint_id: 2,
    position: 2,
    assignee_id: 11,
    reporter_id: 20,
  },
];

const mockSprints = [
  { id: 2, name: "Sprint 2", status: "in_progress", project_id: 1 },
  { id: 3, name: "Sprint 3", status: "not_started", project_id: 1 },
];

const mockUsers = [
  { id: 10, display_name: "Alice" },
  { id: 11, display_name: "Bob" },
  { id: 20, display_name: "Casey" },
  { id: 21, display_name: "Dee" },
];

function installFetch(options = {}) {
  const {
    projects = mockProjects,
    columns = mockColumns,
    tasks = mockTasks,
    sprints = mockSprints,
    users = mockUsers,
    failProjects = false,
    failColumns = false,
    failTasks = false,
    failSprints = false,
    throwColumns = false,
    failCreateSprint = false,
    throwCreateSprint = false,
    failAddTask = false,
    throwAddTask = false,
    rejectProjectsJson = false,
    rejectColumnsJson = false,
    rejectTasksJson = false,
    rejectSprintsJson = false,
    failUpdateSprint = false,
    rejectUpdateSprintJson = false,
    rejectCreateSprintJson = false,
    rejectAddTaskJson = false,
  } = options;

  const fetchMock = vi.fn(async (url, requestOptions = {}) => {
    const urlStr = String(url);
    const method = requestOptions.method ?? "GET";

    if (throwColumns && urlStr.includes("/api/columns")) {
      throw new Error("network-failure");
    }

    if (urlStr === "/api/projects") {
      if (rejectProjectsJson) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad-projects-json");
          },
        };
      }
      return failProjects
        ? { ok: false, json: async () => ({ error: "mock-api-error" }) }
        : { ok: true, json: async () => projects };
    }
    if (urlStr.startsWith("/api/columns?project_id=")) {
      if (rejectColumnsJson) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad-columns-json");
          },
        };
      }
      return failColumns
        ? { ok: false, json: async () => ({ error: "mock-api-error" }) }
        : { ok: true, json: async () => columns };
    }
    if (urlStr.startsWith("/api/tasks?project_id=")) {
      if (rejectTasksJson) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad-tasks-json");
          },
        };
      }
      return failTasks
        ? { ok: false, json: async () => ({ error: "mock-api-error" }) }
        : { ok: true, json: async () => tasks };
    }
    if (urlStr.startsWith("/api/sprints?project_id=")) {
      if (rejectSprintsJson) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad-sprints-json");
          },
        };
      }
      return failSprints
        ? { ok: false, json: async () => ({ error: "mock-api-error" }) }
        : { ok: true, json: async () => sprints };
    }
    if (urlStr === "/api/users") {
      return { ok: true, json: async () => users };
    }
    if (urlStr === "/api/sprints" && method === "POST") {
      if (throwCreateSprint) {
        throw new Error("create-sprint-failure");
      }
      if (failCreateSprint && rejectCreateSprintJson) {
        return {
          ok: false,
          json: async () => {
            throw new Error("bad-create-json");
          },
        };
      }
      return failCreateSprint
        ? { ok: false, json: async () => ({ error: "create-failed" }) }
        : { ok: true, json: async () => ({ id: 99 }) };
    }
    if (urlStr.startsWith("/api/sprints/") && method === "PUT") {
      if (failUpdateSprint) {
        if (rejectUpdateSprintJson) {
          return {
            ok: false,
            json: async () => {
              throw new Error("bad-update-json");
            },
          };
        }
        return { ok: false, json: async () => ({ error: "update-failed" }) };
      }
      return { ok: true, json: async () => ({ id: 2 }) };
    }
    if (urlStr.startsWith("/api/tasks/") && method === "PUT") {
      if (throwAddTask) {
        throw new Error("add-task-failure");
      }
      if (failAddTask && rejectAddTaskJson) {
        return {
          ok: false,
          json: async () => {
            throw new Error("bad-add-json");
          },
        };
      }
      return failAddTask
        ? { ok: false, json: async () => ({ error: "add-failed" }) }
        : { ok: true, json: async () => ({ id: 123 }) };
    }
    return { ok: true, json: async () => [] };
  });
  global.fetch = fetchMock;
  return fetchMock;
}

describe("Home", () => {
  let originalFetch;
  let fetchMock;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = installFetch();
    Object.values(spies).forEach((spy) => spy.mockClear());
  });

  afterEach(() => {
    mountedHomes.splice(0).forEach(({ root, container }) => {
      try {
        root.unmount();
      } catch {
        // no-op in tests
      }
      if (container?.isConnected) {
        container.remove();
      }
    });
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads projects, columns, tasks, sprints, and users", async () => {
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/projects");
      expect(fetchMock).toHaveBeenCalledWith("/api/users");
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=1");
      expect(fetchMock).toHaveBeenCalledWith("/api/tasks?project_id=1");
      expect(fetchMock).toHaveBeenCalledWith("/api/sprints?project_id=1");
    });

    expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:2");
  });

  it("switches between Board, Backlog and Old Sprints tabs", async () => {
    renderHome({ projectId: 1 });

    await screen.findByTestId("scrum-view");
    fireEvent.click(screen.getByRole("button", { name: "Backlog" }));
    expect(await screen.findByTestId("backlog-view")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Old Sprints" }));
    expect(await screen.findByTestId("old-sprints-view")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    expect(await screen.findByTestId("scrum-view")).toBeTruthy();
  });

  it("opens and closes modal, and reloads after task creation", async () => {
    renderHome({ projectId: 1 });
    await screen.findByTestId("scrum-view");

    fireEvent.click(screen.getByRole("button", { name: "New Task" }));
    expect(await screen.findByTestId("task-form")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel Task" }));
    await waitFor(() => {
      expect(screen.queryByTestId("task-form")).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "New Task" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save Task" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=1");
    });
  });

  it("changes project and stays on current tab", async () => {
    renderHome({ projectId: 1 });
    await screen.findByTestId("scrum-view");

    fireEvent.click(screen.getByRole("button", { name: "Old Sprints" }));
    fireEvent.click(screen.getByRole("button", { name: "Pick Project 2" }));

    await waitFor(() => {
      expect(screen.getByText(/Project 2 Old Sprints/)).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=2");
    });
  });

  it("handles project creation callback and switches to the new project", async () => {
    renderHome({ projectId: 1 });
    await screen.findByTestId("scrum-view");

    fireEvent.click(screen.getByRole("button", { name: "Create Project 7" }));

    await waitFor(() => {
      expect(screen.getByText(/Project 7 Board/)).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=7");
    });
  });

  it("filters scrum tasks by assignee and reporter", async () => {
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:2");
    });

    fireEvent.change(screen.getByLabelText("Assignee:"), {
      target: { value: "10" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:1");
    });

    fireEvent.change(screen.getByLabelText("Reporter:"), {
      target: { value: "21" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:0");
    });
  });

  it("handles API error when loading projects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = installFetch({ failProjects: true });

    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "API error loading projects",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith("/api/projects");
    });
  });

  it("handles API error when loading columns", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failColumns: true });

    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "API error loading columns",
        expect.any(Object),
      );
      expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:0");
    });
  });

  it("handles API error when loading tasks", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failTasks: true });

    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "API error loading tasks",
        expect.any(Object),
      );
      expect(screen.getByTestId("scrum-view").textContent).toContain("scrum:0");
    });
  });

  it("handles API error when loading sprints", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failSprints: true });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "API error loading sprints",
        expect.any(Object),
      );
      expect(screen.getByTestId("sprints-view").textContent).toContain(
        "sprint:none",
      );
    });
  });

  it("handles network exception branch during loadColumns", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ throwColumns: true });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Fetch error", expect.any(Error));
      expect(screen.getByTestId("backlog-view").textContent).toContain(
        "backlog:0",
      );
    });
  });

  it("updates sprint status to in_progress and places unassigned sprint tasks", async () => {
    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    await waitFor(() => {
      expect(screen.getByTestId("sprints-view").textContent).toContain(
        "sprint:Sprint 2",
      );
    });

    await waitFor(() => {
      const latestProps = spies.sprintsProps.mock.calls.at(-1)?.[0];
      const sprintTasks = latestProps?.columns?.[0]?.tasks ?? [];
      expect(
        sprintTasks.some((task) => Number(task.id) === 3 && task.column_id == null),
      ).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "Start Sprint" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/sprints/2", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/tasks/3", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=1");
    });
  });

  it("updates sprint status to complete and clears incomplete tasks", async () => {
    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    await waitFor(() => {
      expect(screen.getByTestId("sprints-view").textContent).toContain(
        "sprint:Sprint 2",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Complete Sprint" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/sprints/2", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/tasks/1", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/columns?project_id=1");
    });
  });

  it("creates sprint and adds task to sprint from backlog", async () => {
    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    fireEvent.click(screen.getByRole("button", { name: "Create Sprint" }));
    fireEvent.click(screen.getByRole("button", { name: "Add To Sprint" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/sprints", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith("/api/tasks/999", expect.any(Object));
    });
  });

  it("disables add-to-sprint callback when no active sprint exists", async () => {
    installFetch({
      sprints: [{ id: 9, name: "Done Sprint", status: "complete", project_id: 1 }],
    });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));

    await waitFor(() => {
      expect(screen.getByTestId("can-add").textContent).toBe("false");
    });
  });

  it("handles createSprint API non-ok and thrown error branches", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failCreateSprint: true });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error creating sprint",
        expect.objectContaining({ error: "create-failed" }),
      );
    });

    consoleSpy.mockClear();
    installFetch({ throwCreateSprint: true });

    fireEvent.click(screen.getByRole("button", { name: "Create Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error creating sprint",
        expect.any(Error),
      );
    });

    consoleSpy.mockClear();
    installFetch({ failCreateSprint: true, rejectCreateSprintJson: true });

    fireEvent.click(screen.getByRole("button", { name: "Create Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error creating sprint", null);
    });
  });

  it("handles addTaskToSprint API non-ok and thrown error branches", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failAddTask: true });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));
    fireEvent.click(screen.getByRole("button", { name: "Add To Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding task to sprint",
        expect.objectContaining({ error: "add-failed" }),
      );
    });

    consoleSpy.mockClear();
    installFetch({ throwAddTask: true });

    fireEvent.click(screen.getByRole("button", { name: "Add To Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding task to sprint",
        expect.any(Error),
      );
    });

    consoleSpy.mockClear();
    installFetch({ failAddTask: true, rejectAddTaskJson: true });

    fireEvent.click(screen.getByRole("button", { name: "Add To Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error adding task to sprint",
        null,
      );
    });
  });

  it("handles JSON parse fallback branches for projects/columns/tasks/sprints", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    installFetch({ rejectProjectsJson: true });
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("API error loading projects", null);
    });

    consoleSpy.mockClear();
    installFetch({ rejectColumnsJson: true });
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("API error loading columns", null);
    });

    consoleSpy.mockClear();
    installFetch({ rejectTasksJson: true });
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("API error loading tasks", null);
    });

    consoleSpy.mockClear();
    installFetch({ rejectSprintsJson: true });
    renderHome({ projectId: 1 });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("API error loading sprints", null);
    });
  });

  it("handles updateSprintStatus response JSON rejection fallback", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    installFetch({ failUpdateSprint: true, rejectUpdateSprintJson: true });

    renderHome({ projectId: 1 });
    fireEvent.click(await screen.findByRole("button", { name: "Backlog" }));
    fireEvent.click(screen.getByRole("button", { name: "Start Sprint" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating sprint status",
        null,
      );
    });
  });
});
