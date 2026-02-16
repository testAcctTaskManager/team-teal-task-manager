// Cypress component testing support file
// - Re-exports the Cypress React mount function
// - Sets up a helper to mount components with React Router

import { mount } from "cypress/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../../src/index.css";

import TaskDetail from "../../../src/pages/TaskDetail.jsx";
import TaskForm from "../../../src/components/TaskForm.jsx";
import { UsersProvider } from "../../../src/contexts/UsersContext.jsx";
import Kanban from "../../../src/components/Kanban.jsx";

// Make mount available globally in Cypress tests via cy.mount
Cypress.Commands.add("mount", mount);

// Helper to mount TaskDetail with a router and initial route
export function mountTaskDetail(initialPath = "/task/1") {
  return mount(
    <UsersProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </MemoryRouter>
    </UsersProvider>
  );
}

// Helper to mount TaskForm with common default props
export function mountTaskForm(props = {}) {
  const onSuccess = cy.stub().as("onSuccess");
  const onCancel = cy.stub().as("onCancel");

  cy.mount(
    <UsersProvider>
      <TaskForm
        projectId={1}
        {...props}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </UsersProvider>,
  );

  return { onSuccess, onCancel };
}

// Helper to mount Kanban with test columns and tasks
export function mountKanban() {
  const columns = [
            {
                id: 1,
                title: "To Do",
                tasks: [
                  {
                    id: 1,
                    project_id: 1,
                    column_id: 1,
                    sprint_id: 1,
                    reporter_id: 1,
                    assignee_id: 2,
                    created_by: 1,
                    modified_by: 2,
                    title: "Set up project",
                    description: "Initialize repo, CI and migrations",
                    start_date: "2026-01-02",
                    due_date: "2026-01-04",
                    position: 0
                  },
                  {
                    id: 2,
                    project_id: 1,
                    column_id: 1,
                    sprint_id: 1,
                    reporter_id: 2,
                    assignee_id: 2,
                    created_by: 2,
                    modified_by: 2,
                    title: "Create tasks endpoint",
                    description: "Implement CRUD handlers for Tasks",
                    start_date: "2026-01-03",
                    due_date: "2026-01-07",
                    position: 1
                  }
                ]
            },
            {
                id: 2,
                title: "Blocked",
                tasks: [
                  {
                    id: 3,
                    project_id: 1,
                    column_id: 2,
                    sprint_id: 1,
                    reporter_id: null,
                    assignee_id: 1,
                    created_by: null,
                    modified_by: null,
                    title: "Write docs",
                    description: "Add README notes for local dev",
                    start_date: null,
                    due_date: null,
                    position: 2
                  }
                ]
            },
            {
                id: 3,
                title: "In Progress",
                tasks: []
            },
            {
                id: 4,
                title: "In Review",
                tasks: []
            },
            {
                id: 5,
                title: "Complete",
                tasks: []
            }
        ];
  return mount(
    <UsersProvider>
      <MemoryRouter>
        <Kanban columns={columns}/>
      </MemoryRouter>
    </UsersProvider>
  );
}