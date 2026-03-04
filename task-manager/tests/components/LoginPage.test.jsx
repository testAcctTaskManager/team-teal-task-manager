import { describe, it, expect, vi } from "vitest";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

vi.mock("../../src/components/login/GoogleSignInButton.jsx", () => {
  return {
    GoogleSignInButton: () => <div data-testid="mock-google" />,
  };
});

import LoginPage from "../../src/components/login/LoginPage.jsx";

describe("LoginPage", () => {
  it("renders heading and GoogleSignInButton", () => {
    const { container } = renderWithRoot(<LoginPage />);
    const heading = container.querySelector('h2');
    expect(heading).not.toBeNull();
    expect(heading.textContent.toLowerCase()).toContain('sign in');

    const mock = container.querySelector('[data-testid="mock-google"]');
    expect(mock).not.toBeNull();
  });
});
