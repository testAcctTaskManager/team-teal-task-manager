import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import LoginButton from "../../src/components/login/LoginButton.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

// allows us to assert /login call without doing actual navigation
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// fake function that does nothing but record when it's called
const mockLogout = vi.fn();
// allow each test to set its own return value
const mockUseUsers = vi.fn();
vi.mock("../../src/contexts/UsersContext.jsx", () => ({
  useUsers: () => mockUseUsers(),
}));

describe("LoginButton", () => {
  //reset mockNavigate and mockLogout before every test
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  it("renders link to /login with proper class and aria", () => {
    mockUseUsers.mockReturnValue({
      isAuthenticated: false,
      currentUser: null,
      authLoading: false,
      logout: mockLogout,
    });

    const { container } = renderWithRoot(
      // MemoryRouter mocks routing context
      <MemoryRouter initialEntries={["/"]}>
        <LoginButton />
      </MemoryRouter>,
    );

    const link = container.querySelector('a[aria-label="Login"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/login");
  });

  it("does not render Login link when already on /login page", () => {
    mockUseUsers.mockReturnValue({
      isAuthenticated: false,
      currentUser: null,
      authLoading: false,
      logout: mockLogout,
    });

    const { container } = renderWithRoot(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginButton />
      </MemoryRouter>,
    );

    const link = container.querySelector('a[aria-label="Login"]');
    expect(link).toBeNull();
  });

  it("renders Sign Out button when user is authenticated", () => {
    mockUseUsers.mockReturnValue({
      isAuthenticated: true,
      currentUser: { id: 1, display_name: "Alice" },
      authLoading: false,
      logout: mockLogout,
    });

    const { container } = renderWithRoot(
      // MemoryRouter mocks routing context
      <MemoryRouter>
        <LoginButton />
      </MemoryRouter>,
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button.textContent).toBe("Sign out");
  });

  it("calls logout and navigates to /login when Sign Out is clicked", async () => {
    mockUseUsers.mockReturnValue({
      isAuthenticated: true,
      currentUser: { id: 1, display_name: "Alice" },
      authLoading: false,
      logout: mockLogout,
    });

    const { container } = renderWithRoot(
      // MemoryRouter mocks routing context
      <MemoryRouter>
        <LoginButton />
      </MemoryRouter>,
    );

    const button = container.querySelector("button");

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
