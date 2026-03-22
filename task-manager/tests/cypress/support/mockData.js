// Shared mock data for all Cypress tests (component and integration)
// This is the single source of truth for test fixtures

export const mockUsers = [
  { id: 1, display_name: 'Alice Developer', email: 'alice@example.com', timezone: 'UTC', role: 'developer' },
  { id: 2, display_name: 'Bob Tester', email: 'bob@example.com', timezone: 'UTC', role: 'developer' },
  { id: 3, display_name: 'Carol Manager', email: 'carol@example.com', timezone: 'UTC', role: 'admin' },
];

export const mockProjects = [
  { id: 1, name: 'Demo Project 1', created_by: 1 },
  { id: 2, name: 'Demo Project 2', created_by: 2 },
  { id: 3, name: 'Demo Project 3', created_by: 3 },
];

export const mockColumns = {
  1: [
    { id: 1, project_id: 1, name: 'To Do', key: 'todo', position: 1 },
    { id: 2, project_id: 1, name: 'Blocked', key: 'blocked', position: 2 },
    { id: 3, project_id: 1, name: 'In Progress', key: 'in_progress', position: 3 },
    { id: 4, project_id: 1, name: 'In Review', key: 'in_review', position: 4 },
    { id: 5, project_id: 1, name: 'Complete', key: 'complete', position: 5 },
  ],
  2: [
    { id: 6, project_id: 2, name: 'To Do', key: 'todo', position: 1 },
    { id: 7, project_id: 2, name: 'Blocked', key: 'blocked', position: 2 },
    { id: 8, project_id: 2, name: 'In Progress', key: 'in_progress', position: 3 },
    { id: 9, project_id: 2, name: 'In Review', key: 'in_review', position: 4 },
    { id: 10, project_id: 2, name: 'Complete', key: 'complete', position: 5 },
  ],
};

export const mockTasks = {
  1: [
    { id: 1, project_id: 1, column_id: 1, sprint_id: 1, reporter_id: 1, assignee_id: 2, created_by: 1, modified_by: 2, title: 'Set up project', description: 'Initialize repo, CI and migrations', start_date: '2026-01-02', due_date: '2026-01-04', position: 0 },
    { id: 2, project_id: 1, column_id: 1, sprint_id: 1, reporter_id: 2, assignee_id: 2, created_by: 2, modified_by: 2, title: 'Create tasks endpoint', description: 'Implement CRUD handlers for Tasks', start_date: '2026-01-03', due_date: '2026-01-07', position: 1 },
    { id: 3, project_id: 1, column_id: 2, sprint_id: 1, reporter_id: null, assignee_id: 1, created_by: null, modified_by: null, title: 'Write docs', description: 'Add README notes for local dev', start_date: null, due_date: null, position: 0 },
  ],
  2: [
    { id: 4, project_id: 2, column_id: 6, sprint_id: 1, reporter_id: 1, assignee_id: 1, created_by: 1, modified_by: 2, title: 'Design UI', description: 'Mockup screens', start_date: '2023-02-02', due_date: '2023-02-05', position: 0 },
    { id: 5, project_id: 2, column_id: 7, sprint_id: 1, reporter_id: 2, assignee_id: 1, created_by: 2, modified_by: 2, title: 'Review PR', description: 'Check code quality', start_date: '2023-02-03', due_date: '2023-02-07', position: 1 },
    { id: 6, project_id: 2, column_id: 8, sprint_id: 1, reporter_id: 1, assignee_id: 1, created_by: 1, modified_by: 2, title: 'Fix login bug', description: 'Auth error', start_date: null, due_date: null, position: 0 },
  ],
};

export const mockComments = {
  1: [
    { id: 1, task_id: 1, created_by: 2, content: 'This task has no AC.', created_at: '2026-01-05T00:00:00.000Z', updated_at: '2026-01-05T00:00:00.000Z' },
    { id: 2, task_id: 1, created_by: 3, content: 'Added AC.', created_at: '2026-01-06T00:00:00.000Z', updated_at: '2026-01-06T00:00:00.000Z' },
  ],
  2: [
    { id: 3, task_id: 2, created_by: 1, content: 'This task should be on next sprint.', created_at: '2026-01-07T00:00:00.000Z', updated_at: '2026-01-07T00:00:00.000Z' },
  ],
};

/**
 * Builds columns with embedded tasks for the Kanban board display.
 * This format is what the frontend components expect.
 */
export function getColumnsWithTasks(projectId = 1) {
  const columns = mockColumns[projectId] || mockColumns[1];
  const tasks = mockTasks[projectId] || mockTasks[1];

  return columns.map(col => ({
    id: col.id,
    title: col.name,
    tasks: tasks.filter(t => t.column_id === col.id),
  }));
}
