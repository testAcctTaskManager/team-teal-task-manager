// Cypress component testing support file
// - Re-exports the Cypress React mount function
// - Sets up a helper to mount components with React Router

import { mount } from "cypress/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../../src/index.css";

import TaskDetail from "../../../src/pages/TaskDetail.jsx";
import TaskForm from "../../../src/components/TaskForm.jsx";
import { UsersProvider } from "../../../src/contexts/UsersContext.jsx";
import KanbanColumn from "../../../src/components/KanbanColumn";
import { DragDropContext } from "@hello-pangea/dnd";


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

// Helper to mount KanbanColumn with default props
export function mountKanbanColumn(tasks = []) {
  return cy.mount(
    <MemoryRouter>
      <UsersProvider>
        <DragDropContext onDragEnd={() => {}}>
          <KanbanColumn title="Test Column" colIndex={0} tasks={tasks} />
        </DragDropContext>
      </UsersProvider>
    </MemoryRouter>
  );
}