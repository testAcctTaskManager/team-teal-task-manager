/// <reference types="cypress" />

import { seedData } from '../support/integration.js';

/**
 * Developer Claiming Task Workflow Integration Test
 *
 * This test covers the complete developer workflow using REAL API calls
 * against the Wrangler + D1 backend (no mocking).
 *
 * Workflow:
 * 1. Developer login
 * 2. Developer dashboard (home page with project selector)
 * 3. Select project and see kanban board
 * 4. Start the sprint so tasks appear on the board
 * 5. See task in To-Do column
 * 6. Open task details
 * 7. Add comment to task
 * 8. Close task detail (go back)
 * 9. Move task from To-Do to In Progress via drag-and-drop
 * 10. Log out and verify login page renders
 */

describe('Developer Claiming Task Workflow', () => {
  beforeEach(() => {
    // Login as developer (alice@example.com) before each test
    cy.loginAs('developer');
  });

  describe('Login and Dashboard Access', () => {
    it('redirects unauthenticated users to login page', () => {
      // Clear session cookie to simulate unauthenticated user
      cy.clearCookie('session');
      cy.visit('/');
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });

    it('shows developer dashboard with kanban board on successful login', () => {
      cy.goToBoard();

      // Assert: Project 1 is pre-selected and kanban board renders
      cy.contains('Demo Project 1').should('be.visible');

      // Assert: Navigation links are visible for authenticated users
      cy.contains('My Profile').should('be.visible');
      cy.contains('Kanban').should('be.visible');
    });
  });

  describe('Project Selection and Kanban Board', () => {
    it('renders the correct kanban board when a project is selected', () => {
      cy.goToBoard();

      // Assert: Project 1 is pre-selected
      cy.contains('Demo Project 1').should('be.visible');

      // Assert: Correct kanban board renders with all columns
      seedData.columns.project1.forEach(columnName => {
        cy.contains(columnName).should('be.visible');
      });
    });

    it('shows empty board before sprint is started', () => {
      cy.goToBoard();

      // Board columns are visible but no task cards exist until sprint starts
      cy.contains('To Do').should('be.visible');
      cy.get('[data-testid="task-card"]').should('not.exist');
    });

    it('starts the sprint and verifies tasks become visible on the board', () => {
      cy.goToBoard();

      // Step 1: Switch to Backlog tab
      cy.contains('button', 'Backlog').click();
      cy.contains('button', 'Start Sprint').should('be.visible');

      // Step 2: Use API to start the sprint (synchronous - guaranteed complete before next command)
      cy.request({
        method: 'PUT',
        url: '/api/sprints/1',
        body: { status: 'in_progress' },
        headers: { 'Content-Type': 'application/json' },
      }).its('status').should('eq', 200);

      // Step 3: Confirm the UI reflects the sprint is now active
      cy.reload();
      cy.waitForBoardLoad();
      cy.contains('button', 'Backlog').click();
      cy.contains('button', 'Complete Sprint').should('be.visible');

      // Step 4: Go to Board and verify tasks appear
      cy.contains('button', 'Board').click();
      cy.waitForBoardLoad();
      cy.contains('[data-testid="task-card"]', 'Set up project').should('exist');
      cy.contains('[data-testid="task-card"]', 'Create tasks endpoint').should('exist');
    });

    it('displays tasks in the correct columns', () => {
      // Sprint is now in_progress (started by previous test in this run)
      cy.goToBoard();

      // Assert: Tasks exist on the board
      cy.contains('[data-testid="task-card"]', 'Set up project').should('exist');
      cy.contains('[data-testid="task-card"]', 'Create tasks endpoint').should('exist');
      cy.contains('[data-testid="task-card"]', 'Write docs').should('exist');

      // Verify To Do column has expected tasks
      cy.verifyTaskInColumn('Set up project', 'To Do');
      cy.verifyTaskInColumn('Create tasks endpoint', 'To Do');

      // Verify Blocked column has "Write docs" task
      cy.verifyTaskInColumn('Write docs', 'Blocked');
    });

    it('loads different projects when switching selection', () => {
      cy.goToBoard();

      // Start sprint 5 for project 2 via API so its tasks are visible on the board
      cy.request({
        method: 'PUT',
        url: '/api/sprints/5',
        body: { status: 'in_progress' },
        headers: { 'Content-Type': 'application/json' },
      });

      cy.selectProject('Demo Project 2');

      // Assert: Project 2 tasks are shown
      cy.contains('Design UI').should('exist');
      cy.contains('Review PR').should('exist');
      cy.contains('Fix login bug').should('exist');

      // Project 1 tasks should not be visible
      cy.contains('Set up project').should('not.exist');
    });
  });

  describe('Task Details and Comments', () => {
    it('displays correct task details when a task is selected', () => {
      cy.goToBoard();
      cy.openTask('Set up project');

      // Assert: Correct task details appear
      cy.contains('h1', 'Set up project').should('be.visible');
      cy.contains('Initialize repo, CI and migrations').should('be.visible');
    });

    it('allows adding a comment to a task', () => {
      const testComment = `Test comment ${Date.now()}`;

      cy.goToBoard();
      cy.openTask('Set up project');

      // Wait for task detail to fully load
      cy.contains('h1', 'Set up project').should('be.visible');

      cy.get('textarea[placeholder="Write a comment..."]', { timeout: 10000 }).should('be.visible');

      // Add comment
      cy.get('textarea[placeholder="Write a comment..."]').type(testComment);
      cy.contains('button', 'Add Comment').click();

      // Wait for comment to appear
      cy.contains(testComment, { timeout: 10000 }).should('be.visible');

      // Assert: Comment textarea is cleared
      cy.get('textarea[placeholder="Write a comment..."]').should('have.value', '');
    });
  });

  describe('Task Movement (Drag and Drop)', () => {
    // Test task movement via API since @hello-pangea/dnd doesn't respond to Cypress synthetic events
    it('moves task from To-Do to In Progress via API and UI reflects the change', () => {
      cy.goToBoard();

      // Verify task is initially in To Do column
      cy.verifyTaskInColumn('Set up project', 'To Do');

      // Move task via API (Task ID 1 -> Column ID 3 "In Progress")
      cy.request({
        method: 'PATCH',
        url: '/api/tasks/1',
        body: { column_id: 3 },
        headers: { 'Content-Type': 'application/json' },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // Reload to see the change reflected in UI
      cy.reload();
      cy.waitForBoardLoad();

      // Assert: Task is now in In Progress column
      cy.verifyTaskInColumn('Set up project', 'In Progress');
      cy.verifyTaskNotInColumn('Set up project', 'To Do');

      // Cleanup: Move task back to To Do (Column ID 1) so other tests aren't affected
      cy.request({
        method: 'PATCH',
        url: '/api/tasks/1',
        body: { column_id: 1 },
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('Logout Flow', () => {
    it('returns to login page when developer logs out', () => {
      cy.goToBoard();

      cy.contains('Sign out').should('be.visible');
      cy.performLogout();

      // Assert: Login page renders again
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });

  describe('Full Developer Workflow Integration', () => {
    beforeEach(() => {
      // Reset sprint 1 to not_started so this test can click "Start Sprint"
      // (earlier tests in the suite leave sprint 1 in_progress)
      cy.request({
        method: 'PUT',
        url: '/api/sprints/1',
        body: { status: 'not_started' },
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('completes the full developer claiming task workflow', () => {
      const testComment = `Claiming task at ${Date.now()}`;

      // ===== STEP 1: Developer Login & View Board =====
      cy.goToBoard();
      cy.contains('Demo Project 1').should('be.visible');

      // ===== STEP 2: Start the Sprint =====
      // Sprint must be started before tasks appear on the board
      cy.intercept('PUT', '/api/sprints/*').as('startSprint');
      cy.contains('button', 'Backlog').click();
      cy.contains('button', 'Start Sprint').click();
      cy.wait('@startSprint');
      cy.reload();
      cy.waitForBoardLoad();

      // ===== STEP 3: Verify Board State =====
      cy.contains('[data-testid="task-card"]', 'Set up project').should('exist');
      cy.contains('[data-testid="task-card"]', 'Create tasks endpoint').should('exist');
      cy.verifyTaskInColumn('Set up project', 'To Do');

      // ===== STEP 4: Open Task from To-Do =====
      cy.openTask('Create tasks endpoint');

      // Assert: Correct task details appear
      cy.contains('h1', 'Create tasks endpoint').should('be.visible');
      cy.contains('Implement CRUD handlers for Tasks').should('be.visible');

      // ===== STEP 5: Add Comment =====
      cy.get('textarea[placeholder="Write a comment..."]', { timeout: 10000 }).should('be.visible');
      cy.get('textarea[placeholder="Write a comment..."]').type(testComment);
      cy.contains('button', 'Add Comment').click();
      cy.contains(testComment, { timeout: 10000 }).should('be.visible');

      // ===== STEP 6: Close Task (Navigate Back) =====
      cy.backToBoard();

      // ===== STEP 7: Verify we're back on board =====
      cy.contains('To Do').should('be.visible');

      // ===== STEP 8: Log Out =====
      cy.performLogout();

      // Assert: When developer logs out, login page renders again
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });
});
