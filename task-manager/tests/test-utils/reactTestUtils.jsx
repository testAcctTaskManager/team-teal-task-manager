import React, { act } from "react";
import { createRoot } from "react-dom/client";

// Tell React this environment supports act() once for all tests.
 
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Render a React element into a new DOM container using React 18 createRoot.
 */
export function renderWithRoot(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return { container, root };
}

/**
 * Fire a click event wrapped in React act().
 */
export async function click(element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

/**
 * Fire a generic input event wrapped in React act().
 */
export function input(element, value) {
  act(() => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
