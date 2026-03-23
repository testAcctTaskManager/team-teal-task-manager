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
import Board from "../../../src/components/Board.jsx";
import Sprints from "../../../src/components/Sprints.jsx";

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

// Helper to mount Board with test columns and tasks
export function mountKanban(projectId = 1) {
  const columns = getColumnsWithTasks(projectId);
  return mount(
    <MockUsersProvider>
      <MemoryRouter>
        <Board columns={columns} boardTitle="Board" emptyColumnsText="No Columns" />
      </MemoryRouter>
    </MockUsersProvider>
  );
}

export function mountSprints() {
  const sprintColumns = [
    {
      "id": 1,
      "title": "Sprint 1",
      "tasks": [
        {
          "id": 1,
          "project_id": 1,
          "column_id": 1,
          "sprint_id": 1,
          "reporter_id": 1,
          "assignee_id": 2,
          "created_by": 1,
          "modified_by": 2,
          "title": "Set up project",
          "description": "Initialize repo, CI and migrations",
          "start_date": "2026-01-02",
          "due_date": "2026-01-04",
          "created_at": "2026-03-16 23:15:51",
          "updated_at": "2026-03-16 23:15:51",
          "position": 0
        },
        {
          "id": 2,
          "project_id": 1,
          "column_id": 1,
          "sprint_id": 1,
          "reporter_id": 2,
          "assignee_id": 2,
          "created_by": 2,
          "modified_by": 2,
          "title": "Create tasks endpoint",
          "description": "Implement CRUD handlers for Tasks",
          "start_date": "2026-01-03",
          "due_date": "2026-01-07",
          "created_at": "2026-03-16 23:15:51",
          "updated_at": "2026-03-16 23:15:51",
          "position": 1
        }
      ]
    }
  ]
  const setSprintColumns = () => {}
  const setSprintStatus = () => {}
  const updateSprintStatus = () => {}
  return mount(
    <MockUsersProvider>
      <MemoryRouter>
        <Sprints
        columns={sprintColumns}
        sprintStatus="not_started"
        sprintName="Sprint 1"
        setSprintColumns={setSprintColumns}
        setSprintStatus={setSprintStatus}
        updateSprintStatus={updateSprintStatus}
        boardTitle="Sprints"/>
      </MemoryRouter>
    </MockUsersProvider>
  );
}
