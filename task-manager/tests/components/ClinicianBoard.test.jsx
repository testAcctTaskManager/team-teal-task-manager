import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

const spies = vi.hoisted(() => ({
  boardProps: vi.fn(),
}));

vi.mock("../../src/components/Board.jsx", () => ({
  default: (props) => {
    spies.boardProps(props);
    const totalTasks = props.columns.reduce((sum, col) => sum + col.tasks.length, 0);
    return <div data-testid="clinician-board">tasks:{totalTasks}</div>;
  },
}));

vi.mock("../../src/contexts/UsersContext.jsx", async () => {
  const React = await import("react");
  return {
    UsersContext: React.createContext({ currentUser: { id: 42 }, users: [] }),
  };
});

import ClinicianBoard from "../../src/components/ClinicianBoard.jsx";

describe("ClinicianBoard", () => {
  let originalFetch;
  let consoleErrorSpy;

  beforeEach(() => {
    originalFetch = global.fetch;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, name: "To Do", key: "todo" },
            { id: 2, name: "Done", key: "done" },
          ],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, column_id: 1, position: 0, assignee_id: 10, reporter_id: 20, project_id: 1 },
            { id: 2, column_id: 2, position: 0, assignee_id: 11, reporter_id: 21, project_id: 1 },
          ],
        };
      }
      if (urlStr.includes("/api/projects")) {
        return {
          ok: true,
          json: async () => [{ id: 1, name: "Project Alpha" }],
        };
      }
      return { ok: true, json: async () => [] };
    });
    spies.boardProps.mockClear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("loads columns and tasks then renders filtered board", async () => {
    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/columns");
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks?created_by=42");
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:2");
    });
  });

  it("applies assignee, reporter, and status filters", async () => {
    render(
      <ClinicianBoard
        selectedAssignee="10"
        selectedReporter="20"
        selectedStatus="1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:1");
      expect(spies.boardProps).toHaveBeenCalled();
    });
  });

  it("sorts tasks by position within each column", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [{ id: 1, name: "To Do", key: "todo" }],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return {
          ok: true,
          json: async () => [
            { id: 2, column_id: 1, position: 2, assignee_id: 10, reporter_id: 20, project_id: 1 },
            { id: 1, column_id: 1, position: 0, assignee_id: 10, reporter_id: 20, project_id: 1 },
          ],
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      const calls = spies.boardProps.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastProps = calls[calls.length - 1][0];
      expect(lastProps.columns[0].tasks.map((task) => task.id)).toEqual([1, 2]);
    });
  });

  it("shows no tasks when filters do not match", async () => {
    render(
      <ClinicianBoard
        selectedAssignee="999"
        selectedReporter="999"
        selectedStatus="999"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
    });
  });

  it("handles invalid columns response by clearing board", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return { ok: true, json: async () => ({ error: "bad columns" }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "API error loading columns",
        expect.objectContaining({ error: "bad columns" }),
      );
    });
  });

  it("handles invalid task response by clearing board", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, name: "To Do" },
            { id: 2, name: "Done" },
          ],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return { ok: true, json: async () => ({ error: "bad tasks" }) };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "API error loading tasks",
        expect.objectContaining({ error: "bad tasks" }),
      );
    });
  });

  it("handles fetch rejection by clearing board", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Fetch error", expect.any(Error));
    });
  });

  it("handles columns JSON parse failure", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad json");
          },
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error loading columns", null);
    });
  });

  it("merges columns with the same key from different projects into one column", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, name: "To Do", key: "todo", project_id: 1 },
            { id: 2, name: "To Do", key: "todo", project_id: 2 },
            { id: 3, name: "Done", key: "done", project_id: 1 },
          ],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, column_id: 1, position: 0, project_id: 1 },
            { id: 2, column_id: 2, position: 0, project_id: 2 },
            { id: 3, column_id: 3, position: 0, project_id: 1 },
          ],
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      const calls = spies.boardProps.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastProps = calls[calls.length - 1][0];
      // Two unique keys: "todo" and "done" — not three columns
      expect(lastProps.columns).toHaveLength(2);
      const todoCol = lastProps.columns.find((c) => c.key === "todo");
      expect(todoCol.tasks).toHaveLength(2);
    });
  });

  it("enriches tasks with project_name from projects API", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [{ id: 1, name: "To Do", key: "todo" }],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, column_id: 1, position: 0, project_id: 5 },
          ],
        };
      }
      if (urlStr.includes("/api/projects")) {
        return {
          ok: true,
          json: async () => [{ id: 5, name: "My Project" }],
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      const calls = spies.boardProps.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastProps = calls[calls.length - 1][0];
      expect(lastProps.columns[0].tasks[0].project_name).toBe("My Project");
    });
  });

  it("handles tasks JSON parse failure", async () => {
    global.fetch = vi.fn(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/columns")) {
        return {
          ok: true,
          json: async () => [
            { id: 1, name: "To Do" },
            { id: 2, name: "Done" },
          ],
        };
      }
      if (urlStr.includes("/api/tasks")) {
        return {
          ok: true,
          json: async () => {
            throw new Error("bad json");
          },
        };
      }
      return { ok: true, json: async () => [] };
    });

    render(
      <ClinicianBoard
        selectedAssignee="all"
        selectedReporter="all"
        selectedStatus="all"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("clinician-board").textContent).toContain("tasks:0");
      expect(consoleErrorSpy).toHaveBeenCalledWith("API error loading tasks", null);
    });
  });
});
