// Cypress integration testing support file
// Contains custom commands and utilities for integration tests

import { mockUsers, mockProjects, mockColumns, mockTasks, mockComments } from './mockData.js';

// Re-export mock data for tests that import directly from this file
export { mockUsers, mockProjects, mockColumns, mockTasks, mockComments } from './mockData.js';

// Track mutable task state for tests that need to simulate updates
let taskStateByProject = {};

/**
 * Reset task state to original mock data
 * Call this in beforeEach to ensure clean state
 */
Cypress.Commands.add('resetTaskState', () => {
  taskStateByProject = JSON.parse(JSON.stringify(mockTasks));
});

/**
 * Get current task state for a project (mutable copy)
 */
Cypress.Commands.add('getTaskState', (projectId) => {
  if (!taskStateByProject[projectId]) {
    taskStateByProject[projectId] = JSON.parse(JSON.stringify(mockTasks[projectId] || []));
  }
  return cy.wrap(taskStateByProject[projectId]);
});

/**
 * Update task state (for simulating task updates in tests)
 */
Cypress.Commands.add('updateTaskState', (projectId, taskId, updates) => {
  if (!taskStateByProject[projectId]) {
    taskStateByProject[projectId] = JSON.parse(JSON.stringify(mockTasks[projectId] || []));
  }
  taskStateByProject[projectId] = taskStateByProject[projectId].map(t =>
    t.id === taskId ? { ...t, ...updates } : t
  );
});

/**
 * Custom command to login as a mock user
 * Sets up the auth intercept to return the specified user
 */
Cypress.Commands.add('login', (user = mockUsers[0]) => {
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: user,
  }).as('authMe');

  cy.intercept('GET', '/api/users', {
    statusCode: 200,
    body: mockUsers,
  }).as('getUsers');

  cy.intercept('GET', '/api/projects', {
    statusCode: 200,
    body: mockProjects,
  }).as('getProjects');
});

/**
 * Custom command to set up API intercepts for a specific project
 * Uses dynamic alias names (e.g., getColumnsProject1) to allow multiple projects
 */
Cypress.Commands.add('setupProjectIntercepts', (projectId = 1, options = {}) => {
  const { useDynamicTasks = false } = options;
  const columns = mockColumns[projectId] || [];

  cy.intercept('GET', `/api/columns?project_id=${projectId}`, {
    statusCode: 200,
    body: columns,
  }).as(`getColumnsProject${projectId}`);

  // Use dynamic task state if enabled (for tests that modify tasks)
  if (useDynamicTasks) {
    cy.intercept('GET', `/api/tasks?project_id=${projectId}`, (req) => {
      if (!taskStateByProject[projectId]) {
        taskStateByProject[projectId] = JSON.parse(JSON.stringify(mockTasks[projectId] || []));
      }
      req.reply({
        statusCode: 200,
        body: taskStateByProject[projectId],
      });
    }).as(`getTasksProject${projectId}`);
  } else {
    cy.intercept('GET', `/api/tasks?project_id=${projectId}`, {
      statusCode: 200,
      body: mockTasks[projectId] || [],
    }).as(`getTasksProject${projectId}`);
  }

  cy.intercept('GET', `/api/projects/${projectId}`, {
    statusCode: 200,
    body: mockProjects.find(p => p.id === projectId) || mockProjects[0],
  }).as(`getProject${projectId}`);
});

/**
 * Custom command to set up task detail intercepts
 */
Cypress.Commands.add('setupTaskDetailIntercepts', (taskId) => {
  // Find the task from all projects
  let task = null;
  for (const tasks of Object.values(mockTasks)) {
    task = tasks.find(t => t.id === taskId);
    if (task) break;
  }

  if (!task) {
    task = { id: taskId, title: `Task ${taskId}`, project_id: 1 };
  }

  cy.intercept('GET', `/api/tasks/${taskId}`, {
    statusCode: 200,
    body: task,
  }).as('getTaskDetail');

  cy.intercept('GET', `/api/comments?task_id=${taskId}`, {
    statusCode: 200,
    body: mockComments[taskId] || [],
  }).as('getComments');

  // Set up columns for the task's project
  const columns = mockColumns[task.project_id] || mockColumns[1];
  cy.intercept('GET', `/api/columns?project_id=${task.project_id}`, {
    statusCode: 200,
    body: columns,
  }).as('getColumnsForTask');
});

/**
 * Custom command to set up comment post intercept
 */
Cypress.Commands.add('setupPostCommentIntercept', (taskId) => {
  let commentIdCounter = 100;
  cy.intercept('POST', '/api/comments', (req) => {
    const newComment = {
      id: commentIdCounter++,
      task_id: Number(taskId),
      content: req.body.content,
      created_by: req.body.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    req.reply({
      statusCode: 200,
      body: newComment,
    });
  }).as('postComment');
});

/**
 * Custom command to set up task update intercept (for moving tasks)
 */
Cypress.Commands.add('setupTaskUpdateIntercept', () => {
  cy.intercept('PUT', '/api/tasks/*', (req) => {
    const taskId = req.url.split('/').pop();
    req.reply({
      statusCode: 200,
      body: { id: Number(taskId), ...req.body },
    });
  }).as('updateTask');
});

/**
 * Custom command to set up logout intercept
 */
Cypress.Commands.add('setupLogoutIntercept', () => {
  cy.intercept('POST', '/api/auth/logout', {
    statusCode: 200,
    body: { success: true },
  }).as('logout');

  // After logout, auth/me should return 401
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 401,
    body: { error: 'Unauthorized' },
  }).as('authMeUnauthorized');
});
