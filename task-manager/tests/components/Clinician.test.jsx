import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClinicianPage from "../../src/pages/Clinician.jsx";
import { UsersProvider } from "../../src/contexts/UsersContext.jsx";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";

const mockUsers = [
  { id: 1, display_name: "Alice" },
  { id: 2, display_name: "Bob" },
];

const mockColumns = [
  { id: 1, name: "To Do", project_id: 1 },
  { id: 2, name: "In Progress", project_id: 1 },
];

const mockTasks = [
  { id: 1, title: "Task One", column_id: 1, assignee_id: 1, reporter_id: 2, position: 0 },
];

const mockProjects = [
  { id: 1, name: "Project One" },
];

function renderClinicianPage() {
  return renderWithRoot(
    <MemoryRouter>
      <UsersProvider>
        <ClinicianPage />
      </UsersProvider>
    </MemoryRouter>,
  );
}

async function flushAsync() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("ClinicianPage", () => {
  let originalFetch;
  let fetchMock;
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalFetch = global.fetch;
    fetchMock = vi.fn(async (url) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/me")) {
        return { ok: true, json: async () => ({ id: 99, display_name: "Current User" }) };
      }
      if (urlStr.includes("/api/users")) {
        return { ok: true, json: async () => mockUsers };
      }
      if (urlStr.includes("/api/columns")) {
        return { ok: true, json: async () => mockColumns };
      }
      if (urlStr.includes("/api/tasks")) {
        return { ok: true, json: async () => mockTasks };
      }
      if (urlStr.includes("/api/projects")) {
        return { ok: true, json: async () => mockProjects };
      }

      return { ok: true, json: async () => [] };
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders without crashing", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();
    expect(container).not.toBeNull();
  });

  it("renders the 'Clinician Requests' heading", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();
    expect(container.textContent).toContain("Clinician Requests");
  });

  it("renders the '+ New Request' button", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();
    const btn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("New Request"),
    );
    expect(btn).not.toBeNull();
  });

  it("renders Assignee, Reporter, and Status filter labels", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();
    expect(container.textContent).toContain("Assignee:");
    expect(container.textContent).toContain("Reporter:");
    expect(container.textContent).toContain("Status:");
  });

  it("renders all three filter dropdowns", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      expect(container.querySelector("#assignee-filter")).not.toBeNull();
      expect(container.querySelector("#reporter-filter")).not.toBeNull();
      expect(container.querySelector("#status-filter")).not.toBeNull();
    });
  });

  it("status dropdown includes all five clinician column options", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const statusSelect = container.querySelector("#status-filter");
      expect(statusSelect).not.toBeNull();
      const optionTexts = Array.from(statusSelect.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(optionTexts).toContain("To Do");
      expect(optionTexts).toContain("In Progress");
      expect(optionTexts).toContain("Blocked");
      expect(optionTexts).toContain("In Review");
      expect(optionTexts).toContain("Complete");
    });
  });

  it("status dropdown defaults to 'All Task Statuses'", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const statusSelect = container.querySelector("#status-filter");
      expect(statusSelect).not.toBeNull();
      expect(statusSelect.value).toBe("all");
      expect(statusSelect.textContent).toContain("All Task Statuses");
    });
  });

  it("assignee dropdown defaults to 'All Assignees'", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const assigneeSelect = container.querySelector("#assignee-filter");
      expect(assigneeSelect).not.toBeNull();
      expect(assigneeSelect.value).toBe("all");
      expect(assigneeSelect.textContent).toContain("All Assignees");
    });
  });

  it("reporter dropdown defaults to 'All Reporters'", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const reporterSelect = container.querySelector("#reporter-filter");
      expect(reporterSelect).not.toBeNull();
      expect(reporterSelect.value).toBe("all");
      expect(reporterSelect.textContent).toContain("All Reporters");
    });
  });

  it("populates assignee dropdown with users from context", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const assigneeSelect = container.querySelector("#assignee-filter");
      expect(assigneeSelect).not.toBeNull();
      const optionTexts = Array.from(assigneeSelect.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(optionTexts).toContain("Alice");
      expect(optionTexts).toContain("Bob");
    });
  });

  it("populates reporter dropdown with users from context", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const reporterSelect = container.querySelector("#reporter-filter");
      expect(reporterSelect).not.toBeNull();
      const optionTexts = Array.from(reporterSelect.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(optionTexts).toContain("Alice");
      expect(optionTexts).toContain("Bob");
    });
  });

  it("modal is not shown on initial render", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();
    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).toBeNull();
  });

  it("clicking '+ New Request' opens the ClinicianForm modal", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();

    const btn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("New Request"),
    );
    await click(btn);
    await flushAsync();

    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });

  it("modal contains 'Create Clinician Request' heading when open", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();

    const btn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("New Request"),
    );
    await click(btn);
    await flushAsync();

    expect(container.textContent).toContain("Create Clinician Request");
  });

  it("clicking Cancel in the modal closes it", async () => {
    const { container } = renderClinicianPage();
    await flushAsync();

    const newRequestBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent.includes("New Request"),
    );
    await click(newRequestBtn);
    await flushAsync();

    const cancelBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Cancel"),
    );
    expect(cancelBtn).not.toBeNull();
    await click(cancelBtn);
    await flushAsync();

    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).toBeNull();
  });

  it("changing the assignee filter updates the dropdown value", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const assigneeSelect = container.querySelector("#assignee-filter");
      const options = assigneeSelect?.querySelectorAll("option");
      expect(options?.length).toBeGreaterThan(1);
    });

    const assigneeSelect = container.querySelector("#assignee-filter");
    await act(async () => {
      fireEvent.change(assigneeSelect, { target: { value: "1" } });
    });

    expect(assigneeSelect.value).toBe("1");
  });

  it("changing the reporter filter updates the dropdown value", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      const reporterSelect = container.querySelector("#reporter-filter");
      const options = reporterSelect?.querySelectorAll("option");
      expect(options?.length).toBeGreaterThan(1);
    });

    const reporterSelect = container.querySelector("#reporter-filter");
    await act(async () => {
      fireEvent.change(reporterSelect, { target: { value: "2" } });
    });

    expect(reporterSelect.value).toBe("2");
  });

  it("changing the status filter updates the dropdown value", async () => {
    const { container } = renderClinicianPage();
    await waitFor(() => {
      expect(container.querySelector("#status-filter")).not.toBeNull();
    });

    const statusSelect = container.querySelector("#status-filter");
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: "1" } });
    });

    expect(statusSelect.value).toBe("1");
  });

  it("handles API error when loading users gracefully", async () => {
    fetchMock.mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return { ok: false, json: async () => ({}) };
      }
      if (urlStr.includes("/api/columns")) {
        return { ok: true, json: async () => mockColumns };
      }
      if (urlStr.includes("/api/tasks")) {
        return { ok: true, json: async () => mockTasks };
      }
      return { ok: true, json: async () => [] };
    });

    const { container } = renderClinicianPage();
    await flushAsync();
    expect(container).not.toBeNull();
    expect(container.textContent).toContain("Clinician Requests");
  });
});
