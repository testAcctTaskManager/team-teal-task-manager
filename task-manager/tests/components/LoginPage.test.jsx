import { describe, it, expect, vi } from "vitest";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

vi.mock("../../src/components/login/GoogleSignInButton.jsx", () => {
  return {
    GoogleSignInButton: () => <div data-testid="mock-google" />,
  };
});

import LoginPage from "../../src/components/login/LoginPage.jsx";

describe("LoginPage", () => {
  it("shows a user-facing login error when redirected with auth_error=login_failed", () => {
    window.history.pushState({}, "", "/login?auth_error=login_failed");

    const { container } = renderWithRoot(<LoginPage />);
    const alert = container.querySelector('[role="alert"]');

    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain("Unable to log in");
  });

  it("renders heading and GoogleSignInButton", () => {
    window.history.pushState({}, "", "/login");

    const { container } = renderWithRoot(<LoginPage />);
    const heading = container.querySelector('h2');
    expect(heading).not.toBeNull();
    expect(heading.textContent.toLowerCase()).toContain('sign in');

    const mock = container.querySelector('[data-testid="mock-google"]');
    expect(mock).not.toBeNull();
  });

  it("does not show auth error banner without auth_error query", () => {
    window.history.pushState({}, "", "/login");

    const { container } = renderWithRoot(<LoginPage />);
    const alert = container.querySelector('[role="alert"]');

    expect(alert).toBeNull();
  });
});
