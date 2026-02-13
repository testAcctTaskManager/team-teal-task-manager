import { describe, it, expect, vi } from "vitest";
import { renderWithRoot, click } from "../test-utils/reactTestUtils.jsx";
import { GoogleSignInButton } from "../../src/components/login/GoogleSignInButton.jsx";

describe("GoogleSignInButton", () => {
  it("renders button with aria and class and navigates on click", async () => {
    const url = "https://example.com/auth";

  // replace window.location to capture assignment
  const originalLocation = window.location;
  // delete then set so we can assign
  delete window.location;
  // create a mutable location object
  window.location = { href: "", assign: vi.fn() };

    const { container } = renderWithRoot(<GoogleSignInButton authURL={url} />);
    const btn = container.querySelector('button[aria-label="Sign in with Google"]');
    expect(btn).not.toBeNull();
    expect(btn.className).toMatch(/google-sign-in-button/);

  await click(btn);

  // component sets window.location.href = authURL
  expect(window.location.href).toBe(url);

  // restore
    window.location = originalLocation;
  });
});
