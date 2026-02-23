import { describe, it, expect } from "vitest";
import LoginButton from "../../src/components/login/LoginButton.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";
import { MemoryRouter } from "react-router-dom";

describe("LoginButton", () => {
  it("renders link to /login with proper class and aria", () => {
    const { container } = renderWithRoot(
      <MemoryRouter>
        <LoginButton />
      </MemoryRouter>,
    );
    const link = container.querySelector('a[aria-label="Login"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/login");
  });
});
