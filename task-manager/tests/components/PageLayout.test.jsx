import { describe, it, expect } from "vitest";
import React from "react";
import PageLayout from "../../src/components/PageLayout.jsx";
import { renderWithRoot } from "../test-utils/reactTestUtils.jsx";

// Render Component
function renderPageLayout(props = {}) {
  return renderWithRoot(<PageLayout {...props} />);
}

describe("PageLayout", () => {
  it("renders without crashing", () => {
    const { container } = renderPageLayout({ title: "Test" });
    expect(container).not.toBeNull();
  });

  it("displays the title", () => {
    const { container } = renderPageLayout({ title: "My Page" });
    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe("My Page");
  });

  it("renders children", () => {
    const { container } = renderWithRoot(
      <PageLayout title="Test">
        <p id="child-content">Hello World</p>
      </PageLayout>
    );
    const child = container.querySelector("#child-content");
    expect(child).not.toBeNull();
    expect(child.textContent).toBe("Hello World");
  });

  it("renders multiple children", () => {
    const { container } = renderWithRoot(
      <PageLayout title="Test">
        <span id="first">First</span>
        <span id="second">Second</span>
      </PageLayout>
    );
    expect(container.querySelector("#first")).not.toBeNull();
    expect(container.querySelector("#second")).not.toBeNull();
  });

  it("renders with no children", () => {
    const { container } = renderPageLayout({ title: "Empty" });
    const heading = container.querySelector("h1");
    expect(heading.textContent).toBe("Empty");
  });

  it("renders with an empty title", () => {
    const { container } = renderPageLayout({ title: "" });
    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe("");
  });
});
