import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import ProjectForm from "../../src/components/ProjectForm.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

// Mock useUsers to provide a currentUser
vi.mock("../../src/contexts/UsersContext.jsx", () => ({
  useUsers: () => ({ currentUser: { id: 42, display_name: "Test User" } }),
}));

let cleanup;

function renderForm(props = {}) {
  const result = renderWithRoot(
    <ProjectForm
      onSuccess={props.onSuccess || vi.fn()}
      onCancel={props.onCancel || vi.fn()}
    />,
  );
  cleanup = () => {
    if (result.container.parentNode) {
      result.container.parentNode.removeChild(result.container);
    }
  };
  return result;
}

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  it("renders the form with a name input and buttons", () => {
    const { container } = renderForm();
    expect(container.querySelector("#project-name")).toBeTruthy();
    expect(container.textContent).toContain("New Project");
    expect(container.textContent).toContain("Create Project");
    expect(container.textContent).toContain("Cancel");
  });

  it("shows validation error when submitting empty name", async () => {
    const onSuccess = vi.fn();
    const { container } = renderForm({ onSuccess });

    const form = container.querySelector("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(container.textContent).toContain("Project name is required");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const { container } = renderForm({ onCancel });

    const cancelBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Cancel",
    );
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(onCancel).toHaveBeenCalled();
  });

  it("posts to /api/projects and calls onSuccess on successful creation", async () => {
    const mockProject = { id: 99, name: "My Project", status: "not_started" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProject),
    });

    const onSuccess = vi.fn();
    const { container } = renderForm({ onSuccess });

    const input = container.querySelector("#project-name");
    await act(async () => {
      fireEvent.change(input, { target: { value: "My Project" } });
    });

    const form = container.querySelector("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockProject);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Project", created_by: 42 }),
    });
  });

  it("displays an error message when the API returns an error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Name already taken" }),
    });

    const onSuccess = vi.fn();
    const { container } = renderForm({ onSuccess });

    const input = container.querySelector("#project-name");
    await act(async () => {
      fireEvent.change(input, { target: { value: "Dupe Project" } });
    });

    const form = container.querySelector("form");
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Name already taken");
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
