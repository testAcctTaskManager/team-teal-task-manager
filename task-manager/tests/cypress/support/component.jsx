// Cypress component testing support file
// - Re-exports the Cypress React mount function
// - Sets up a helper to mount components with React Router
/* eslint-disable react-refresh/only-export-components */

import { mount } from "cypress/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../../src/index.css";

import TaskDetail from "../../../src/pages/TaskDetail.jsx";
import TaskForm from "../../../src/components/TaskForm.jsx";
import { UsersContext } from "../../../src/contexts/UsersContext.jsx";
import KanbanColumn from "../../../src/components/KanbanColumn";
import ProjectSelector from "../../../src/components/ProjectSelector.jsx";
import { DragDropContext } from "@hello-pangea/dnd";
import Kanban from "../../../src/components/Kanban.jsx";

import { getColumnsWithTasks } from "./mockData.js";

const defaultMockUsersValue = {
  users: [],
  loading: false,
  error: null,
  refetch: () => {},
  currentUser: { id: 1, email: "test@example.com", display_name: "Test User" },
  isAuthenticated: true,
  authLoading: false,
  logout: () => {},
};

function MockUsersProvider({ children, value = {} }) {
  return (
    <UsersContext.Provider value={{ ...defaultMockUsersValue, ...value }}>
      {children}
    </UsersContext.Provider>
  );
}

// Make mount available globally in Cypress tests via cy.mount
Cypress.Commands.add("mount", mount);

// Helper to mount TaskDetail with a router and initial route
export function mountTaskDetail(initialPath = "/task/1") {
  return mount(
    <MockUsersProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </MemoryRouter>
    </MockUsersProvider>
  );
}

// Helper to mount TaskForm with common default props
export function mountTaskForm(props = {}, mockUsersValue = {}) {
  const onSuccess = cy.stub().as("onSuccess");
  const onCancel = cy.stub().as("onCancel");

  cy.mount(
    <MockUsersProvider value={mockUsersValue}>
      <TaskForm
        projectId={1}
        {...props}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </MockUsersProvider>,
  );

  return { onSuccess, onCancel };
}

// Helper to mount KanbanColumn with default props
export function mountKanbanColumn(tasks = []) {
  return cy.mount(
    <MemoryRouter>
      <MockUsersProvider>
        <DragDropContext onDragEnd={() => {}}>
          <KanbanColumn title="Test Column" colIndex={0} tasks={tasks} />
        </DragDropContext>
      </MockUsersProvider>
    </MemoryRouter>
  )
}

// Helper to mount ProjectSelector with default props
export function mountProjectSelector(projects = [], selectedProjectId = null, onSelectProject = () => {}) {
  return cy.mount(
    <MemoryRouter>
      <MockUsersProvider>
        <ProjectSelector projects={projects} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} />
      </MockUsersProvider>
    </MemoryRouter>
  );
}

// Helper to mount Kanban with test columns and tasks
export function mountKanban(projectId = 1) {
  const columns = getColumnsWithTasks(projectId);
  return mount(
    <MockUsersProvider>
      <MemoryRouter>
        <Kanban columns={columns}/>
      </MemoryRouter>
    </MockUsersProvider>
  );
}
