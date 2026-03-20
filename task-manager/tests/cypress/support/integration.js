// Cypress integration testing support file
// Uses real API calls against Wrangler + D1 backend

/**
 * Reference data from the database seed (migrations/007_data_seed.sql)
 * Used for assertions in tests.
 *
 * IMPORTANT: This data is duplicated from migrations/007_data_seed.sql
 * If the seed data changes in either location, the other must be updated
 * to match, or integration tests will fail.
 */
export const seedData = {
  users: {
    alice: { id: 1, display_name: 'Alice Developer', email: 'alice@example.com', role: 'developer' },
    bob: { id: 2, display_name: 'Bob Tester', email: 'bob@example.com', role: 'developer' },
    carol: { id: 3, display_name: 'Carol Manager', email: 'carol@example.com', role: 'admin' },
  },
  projects: {
    demo1: { id: 1, name: 'Demo Project 1' },
    demo2: { id: 2, name: 'Demo Project 2' },
    demo3: { id: 3, name: 'Demo Project 3' },
  },
  columns: {
    project1: ['To Do', 'Blocked', 'In Progress', 'In Review', 'Complete'],
    project2: ['To Do', 'Blocked', 'In Progress', 'In Review', 'Complete'],
  },
  tasks: {
    project1: {
      task1: { id: 1, title: 'Set up project', column: 'To Do', description: 'Initialize repo, CI and migrations' },
      task2: { id: 2, title: 'Create tasks endpoint', column: 'To Do', description: 'Implement CRUD handlers for Tasks' },
      task3: { id: 3, title: 'Write docs', column: 'Blocked', description: 'Add README notes for local dev' },
    },
    project2: {
      task4: { id: 4, title: 'Design UI', column: 'To Do' },
      task5: { id: 5, title: 'Review PR', column: 'Blocked' },
      task6: { id: 6, title: 'Fix login bug', column: 'In Progress' },
    },
  },
  comments: {
    task1: [
      { content: 'This task has no AC.' },
      { content: 'Added AC.' },
    ],
  },
};

/**
 * Login as a user by setting the session cookie with a test JWT
 * Uses environment variable TEST_SESSION_TOKEN set by test-with-server.mjs
 *
 * @param {'developer' | 'admin' | 'mutable'} userType - Type of test user
 */
Cypress.Commands.add('loginAs', (userType = 'developer') => {
  const tokens = {
    developer: Cypress.env('TEST_SESSION_TOKEN'),
    admin: Cypress.env('TEST_ADMIN_SESSION_TOKEN'),
    mutable: Cypress.env('TEST_MUTABLE_SESSION_TOKEN'),
  };

  const token = tokens[userType];
  if (!token) {
    throw new Error(`No test token found for user type "${userType}". Make sure to run tests via npm run test:integration`);
  }

  cy.setCookie('session', token, {
    path: '/',
    httpOnly: false,
  });
});

/**
 * Logout by clearing the session cookie and clicking sign out
 */
Cypress.Commands.add('performLogout', () => {
  cy.contains('Sign out').click();
  cy.url().should('include', '/login');
});

/**
 * Wait for the page to finish loading data
 * Useful after navigation or actions that trigger API calls
 */
Cypress.Commands.add('waitForBoardLoad', () => {
  // Wait for at least one column to render (indicates board is loaded)
  cy.contains(/to do/i, { timeout: 10000 }).should('be.visible');
});

/**
 * Wait for task detail page to load
 */
Cypress.Commands.add('waitForTaskDetailLoad', () => {
  cy.get('h1', { timeout: 10000 }).should('be.visible');
});

/**
 * Navigate to home and wait for board to load
 */
Cypress.Commands.add('goToBoard', () => {
  cy.visit('/');
  cy.waitForBoardLoad();
});

/**
 * Select a project from the project selector
 */
Cypress.Commands.add('selectProject', (projectName) => {
  // Click the current project button to open dropdown (use force for hidden elements)
  cy.get('button').contains(/Demo Project|Select Project/).click({ force: true });
  // Select the desired project (Cypress auto-retries until dropdown renders)
  cy.contains(projectName).click({ force: true });
  // Wait for board to reload
  cy.waitForBoardLoad();
});

/**
 * Open a task by clicking on it
 */
Cypress.Commands.add('openTask', (taskTitle) => {
  cy.contains('[data-testid="task-card"]', taskTitle).click({ force: true });
  cy.waitForTaskDetailLoad();
});

/**
 * Add a comment to the currently open task
 * Note: Using placeholder selector since the textarea uses non-standard `testid` attribute
 * instead of `data-testid` which doesn't pass through to the DOM in React
 */
Cypress.Commands.add('addComment', (commentText) => {
  cy.get('textarea[placeholder="Write a comment..."]').type(commentText);
  cy.contains('button', 'Add Comment').click();
  // Wait for comment to appear
  cy.contains(commentText, { timeout: 10000 }).should('be.visible');
});

/**
 * Go back to the board from task detail
 */
Cypress.Commands.add('backToBoard', () => {
  cy.go('back');
  cy.waitForBoardLoad();
});

/**
 * Verify a task is in a specific column
 * Uses data-testid on task cards and column header text
 */
Cypress.Commands.add('verifyTaskInColumn', (taskTitle, columnName) => {
  cy.get(`section[data-column="${columnName}"]`).within(() => {
    cy.contains('[data-testid="task-card"]', taskTitle).should('exist');
  });
});

/**
 * Verify a task is NOT in a specific column
 */
Cypress.Commands.add('verifyTaskNotInColumn', (taskTitle, columnName) => {
  cy.get(`section[data-column="${columnName}"]`).within(() => {
    cy.contains('[data-testid="task-card"]', taskTitle).should('not.exist');
  });
});
