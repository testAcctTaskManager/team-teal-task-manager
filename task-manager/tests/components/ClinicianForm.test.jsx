import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ClinicianForm from "../../src/components/ClinicianForm.jsx";
import { renderWithRoot, click, input } from "../test-utils/reactTestUtils.jsx";
import { UsersProvider } from "../../src/contexts/UsersContext.jsx";

function renderClinicianForm(props = {}) {
  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const { container, root } = renderWithRoot(
    <UsersProvider>
      <ClinicianForm onSuccess={onSuccess} onCancel={onCancel} />
    </UsersProvider>,
  );

  return { container, root, onSuccess, onCancel };
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("ClinicianForm (Vitest)", () => {
  let originalFetch;
  let fetchMock;
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalFetch = global.fetch;
    fetchMock = vi.fn(async (url) => {
      if (url === "/api/users") {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Default User" }],
        };
      }

      if (url === "/api/projects") {
        return {
          ok: true,
          json: async () => [
            { id: 1, name: "Project One" },
            { id: 2, name: "Project Two" },
          ],
        };
      }

      if (url === "/api/tasks") {
        return {
          ok: true,
          json: async () => ({ id: 1, title: "Created clinician request" }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("validates required title before submit and does not call fetch", async () => {
    const { container } = renderClinicianForm();

    await flushAsync();

    const submitButton = container.querySelector("button[type='submit']");
    expect(submitButton).not.toBeNull();

    await click(submitButton);

    expect(container.textContent).toContain("This field is required");
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/tasks",
      expect.any(Object),
    );
  });

  it("validates required project_id before submit", async () => {
    const { container } = renderClinicianForm();

    await flushAsync();

    const titleInput = container.querySelector("input[name='title']");
    input(titleInput, "Test Request");

    const submitButton = container.querySelector("button[type='submit']");
    await click(submitButton);

    expect(container.textContent).toContain("This field is required");
  });

  it("invokes onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const { container } = renderClinicianForm({ onCancel });

    await flushAsync();

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.includes("Cancel"),
    );

    expect(cancelButton).not.toBeNull();

    await click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("loads projects on mount", async () => {
    const { container } = renderClinicianForm();

    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith("/api/projects");

    const projectSelect = container.querySelector("select[name='project_id']");
    const options = projectSelect.querySelectorAll("option");

    expect(options.length).toBeGreaterThan(1);
    expect(options[1].textContent).toBe("Project One");
  });

  it("allows input in all form fields", async () => {
    const { container } = renderClinicianForm();

    await flushAsync();

    const titleInput = container.querySelector("input[name='title']");
    const descriptionInput = container.querySelector(
      "textarea[name='description']",
    );
    const dueDateInput = container.querySelector("input[name='due_date']");

    expect(titleInput).not.toBeNull();
    expect(descriptionInput).not.toBeNull();
    expect(dueDateInput).not.toBeNull();

    input(titleInput, "Test Title");
    input(descriptionInput, "Test Description");
    input(dueDateInput, "2026-03-15");

    expect(titleInput.value).toBe("Test Title");
    expect(descriptionInput.value).toBe("Test Description");
    expect(dueDateInput.value).toBe("2026-03-15");
  });

  it("displays submit button that can be disabled", async () => {
    const { container } = renderClinicianForm();

    await flushAsync();

    const submitButton = container.querySelector("button[type='submit']");
    expect(submitButton).not.toBeNull();
    expect(submitButton.textContent).toContain("Create Request");
    expect(submitButton.disabled).toBe(false);
  });

  it("handles project loading error gracefully", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/users") {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Test User" }],
        };
      }

      if (url === "/api/projects") {
        throw new Error("Network error");
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    const { container } = renderClinicianForm();

    await flushAsync();

    expect(container.textContent).toContain("Network error loading projects");
  });

  it("handles API error response when loading projects", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url === "/api/users") {
        return {
          ok: true,
          json: async () => [{ id: 1, display_name: "Test User" }],
        };
      }

      if (url === "/api/projects") {
        return {
          ok: true,
          json: async () => ({ error: "Invalid request" }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });

    const { container } = renderClinicianForm();

    await flushAsync();

    expect(container.textContent).toContain("Unable to load projects");
  });
});
