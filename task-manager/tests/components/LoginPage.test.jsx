import { describe, it, expect, vi } from "vitest";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

// Mock the GoogleSignInButton to capture the authURL prop without relying on import.meta.env
vi.mock("../../src/components/login/GoogleSignInButton.jsx", () => {
  return {
    GoogleSignInButton: ({ authURL }) => <div data-testid="mock-google" data-authurl={authURL} />,
  };
});

import LoginPage from "../../src/components/login/LoginPage.jsx";

describe("LoginPage", () => {
  it("renders and passes a built authURL to GoogleSignInButton mock", () => {
    const { container } = renderWithRoot(<LoginPage />);
    const heading = container.querySelector('h2');
    expect(heading).not.toBeNull();
    expect(heading.textContent.toLowerCase()).toContain('sign in');

    const mock = container.querySelector('[data-testid="mock-google"]');
    const auth = mock && mock.getAttribute("data-authurl");
    expect(auth).toBeTruthy();
    // should contain Google auth host or v2 auth endpoint
    expect(/accounts\.google\.com|oauth2\.v2/.test(auth)).toBe(true);
  });
});
