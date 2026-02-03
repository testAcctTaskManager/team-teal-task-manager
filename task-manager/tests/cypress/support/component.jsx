// Cypress component testing support file
// - Re-exports the Cypress React mount function
// - Sets up a helper to mount components with React Router

import { mount } from "cypress/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../../src/index.css";

import TaskDetail from "../../../src/pages/TaskDetail.jsx";
import TaskForm from "../../../src/components/TaskForm.jsx";

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

// Helper to mount TaskForm with common default props
export function mountTaskForm(props = {}) {
  const onSuccess = cy.stub().as("onSuccess");
  const onCancel = cy.stub().as("onCancel");

  cy.mount(
    <TaskForm
      projectId={1}
      createdBy="alice"
      modifiedBy="alice"
      {...props}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  );

  return { onSuccess, onCancel };
}
