import { describe, it, expect, vi } from "vitest";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";
import { GoogleSignInButton } from "../../src/components/login/GoogleSignInButton.jsx";

describe("GoogleSignInButton", () => {
  it("renders button with aria and class and navigates on click", async () => {
    // replace window.location to capture assignment
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: "", assign: vi.fn() };

    const { container } = renderWithRoot(<GoogleSignInButton />);
    const btn = container.querySelector('button[aria-label="Sign in with Google"]');
    expect(btn).not.toBeNull();
    expect(btn.className).toMatch(/google-sign-in-button/);

    await click(btn);

    expect(window.location.href).toBe("/api/auth/login");

    window.location = originalLocation;
  });
});
