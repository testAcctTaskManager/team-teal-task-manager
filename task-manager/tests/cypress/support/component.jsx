// Cypress component testing support file
// - Re-exports the Cypress React mount function
// - Sets up a helper to mount components with React Router

import { mount } from "cypress/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../../src/index.css";

import TaskDetail from "../../../src/pages/TaskDetail.jsx";

// Make mount available globally in Cypress tests via cy.mount
Cypress.Commands.add("mount", mount);

// Helper to mount TaskDetail with a router and initial route
export function mountTaskDetail(initialPath = "/task/1") {
  return mount(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </MemoryRouter>
  );
}
