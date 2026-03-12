/// <reference types="cypress" />

import { mockUsers } from '../support/mockData.js';

/**
 * Developer Claiming Task Workflow Integration Test
 * 
 * This test covers the complete developer workflow:
 * 1. Developer login
 * 2. Developer dashboard (home page with project selector)
 * 3. Select project and see kanban board
 * 4. See task in To-Do column
 * 5. Open task details
 * 6. Add comment to task
 * 7. Close task detail (go back)
 * 8. Move task from To-Do to In Progress via drag-and-drop
 * 9. Log out and verify login page renders
 */

describe('Developer Claiming Task Workflow', () => {
  const developerUser = mockUsers[0]; // Alice Developer

  beforeEach(() => {
    // Reset task state for tests that modify tasks
    cy.resetTaskState();
  });

  describe('Login and Dashboard Access', () => {
    it('redirects unauthenticated users to login page', () => {
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 401,
        body: { error: 'Unauthorized' },
      }).as('authMeUnauthorized');

      cy.visit('/');

      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });

    it('shows developer dashboard with project selector on successful login', () => {
      cy.login(developerUser);
      cy.setupProjectIntercepts(1);

      cy.visit('/');

      cy.wait('@authMe');
      cy.wait('@getUsers');
      cy.wait('@getProjects');

      // Assert: Developer project selector renders
      cy.contains('Select Project').should('be.visible');

      // Assert: Navigation links are visible for authenticated users
      cy.contains('My Profile').should('be.visible');
      cy.contains('Kanban').should('be.visible');
    });
  });

  describe('Project Selection and Kanban Board', () => {
    beforeEach(() => {
      cy.login(developerUser);
      cy.setupProjectIntercepts(1);
      cy.setupProjectIntercepts(2);
    });

    it('renders the correct kanban board when a project is selected', () => {
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();

      cy.wait('@getColumnsProject1');
      cy.wait('@getTasksProject1');

      // Assert: Correct kanban board renders with all columns
      cy.contains('Kanban Board').should('be.visible');
      cy.contains('To Do').should('be.visible');
      cy.contains('Blocked').should('be.visible');
      cy.contains('In Progress').should('be.visible');
      cy.contains('In Review').should('be.visible');
      cy.contains('Complete').should('be.visible');
    });

    it('displays tasks in the correct columns', () => {
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();

      cy.wait('@getColumnsProject1');
      cy.wait('@getTasksProject1');

      // Assert: Tasks populate in the correct columns
      cy.contains('To Do').parent().within(() => {
        cy.contains('Set up project').should('exist');
        cy.contains('Create tasks endpoint').should('exist');
      });

      cy.contains('Blocked').parent().within(() => {
        cy.contains('Write docs').should('exist');
      });
    });

    it('loads different projects when switching selection', () => {
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 2').click();

      cy.wait('@getColumnsProject2');
      cy.wait('@getTasksProject2');

      // Assert: Project 2 tasks are shown
      cy.contains('Design UI').should('exist');
      cy.contains('Review PR').should('exist');
      cy.contains('Fix login bug').should('exist');

      // Project 1 tasks should not be visible
      cy.contains('Set up project').should('not.exist');
    });
  });

  describe('Task Details and Comments', () => {
    beforeEach(() => {
      cy.login(developerUser);
      cy.setupProjectIntercepts(1);
      cy.setupTaskDetailIntercepts(1);
    });

    it('displays correct task details when a task is selected', () => {
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();

      cy.wait('@getColumnsProject1');
      cy.wait('@getTasksProject1');

      cy.contains('Set up project').click();

      cy.wait('@getTaskDetail');
      cy.wait('@getComments');

      // Assert: Correct task details appear
      cy.contains('h1', 'Set up project').should('be.visible');
      cy.contains('Initialize repo, CI and migrations').should('be.visible');

      // Verify existing comments are shown
      cy.contains('This task has no AC.').should('be.visible');
      cy.contains('Added AC.').should('be.visible');
    });

    it('allows adding a comment to a task and persists it', () => {
      const newCommentText = 'I am claiming this task and will start working on it.';

      cy.setupPostCommentIntercept(1);

      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();
      cy.wait('@getTasksProject1');

      cy.contains('Set up project').click();
      cy.wait('@getTaskDetail');
      cy.wait('@getComments');

      cy.get('[testid="comments-textbox"]').type(newCommentText);
      cy.contains('button', 'Add Comment').click();

      cy.wait('@postComment');

      // Assert: New comment appears in the list (comment is persistent)
      cy.contains(newCommentText).should('be.visible');

      // Assert: Comment textarea is cleared
      cy.get('[testid="comments-textbox"]').should('have.value', '');
    });
  });

  describe('Task Movement (Drag and Drop)', () => {
    beforeEach(() => {
      cy.login(developerUser);
      cy.setupProjectIntercepts(1, { useDynamicTasks: true });
      cy.setupTaskUpdateIntercept();
    });

    it('moves task from To-Do to In Progress and renders correctly', () => {
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();

      cy.wait('@getColumnsProject1');
      cy.wait('@getTasksProject1');

      // Verify task is initially in To Do column
      cy.contains('To Do').parent().within(() => {
        cy.contains('Set up project').should('exist');
      });

      // Perform drag and drop
      cy.contains('[data-testid="task-card"]', 'Set up project')
        .trigger('mousedown', { button: 0 })
        .trigger('mousemove', { clientX: 100, clientY: 0 })
        .wait(100);

      cy.contains('In Progress')
        .parent()
        .find('[class*="flex-1"]')
        .trigger('mousemove')
        .trigger('mouseup', { force: true });

      cy.wait('@updateTask');

      // Update the task state to simulate persistence
      cy.updateTaskState(1, 1, { column_id: 3 });

      // Reload to verify persistence
      cy.reload();
      cy.wait('@authMe');
      cy.wait('@getTasksProject1');

      // Assert: Task is now in In Progress column
      cy.contains('In Progress').parent().within(() => {
        cy.contains('Set up project').should('exist');
      });

      // Assert: Task is no longer in To Do column
      cy.contains('To Do').parent().within(() => {
        cy.contains('Set up project').should('not.exist');
      });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      cy.login(developerUser);
      cy.setupProjectIntercepts(1);
    });

    it('returns to login page when developer logs out', () => {
      cy.setupLogoutIntercept();

      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      cy.contains('Sign out').should('be.visible');
      cy.contains('Sign out').click();

      cy.wait('@logout');

      // Assert: Login page renders again
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });

  describe('Full Developer Workflow Integration', () => {
    it('completes the full developer claiming task workflow', () => {
      const newCommentText = 'Starting work on this task now.';

      // Setup all intercepts using helper commands
      cy.login(developerUser);
      cy.setupProjectIntercepts(1, { useDynamicTasks: true });
      cy.setupProjectIntercepts(2);
      cy.setupTaskDetailIntercepts(1);
      cy.setupPostCommentIntercept(1);
      cy.setupTaskUpdateIntercept();
      cy.setupLogoutIntercept();

      // ===== STEP 1: Developer Login =====
      cy.visit('/');
      cy.wait('@authMe');
      cy.wait('@getProjects');

      // Assert: On successful login, developer project selector renders
      cy.contains('Select Project').should('be.visible');

      // ===== STEP 2: Select Project =====
      cy.contains('Select Project').click();
      cy.contains('Demo Project 1').click();

      cy.wait('@getColumnsProject1');
      cy.wait('@getTasksProject1');

      // Assert: Correct kanban board renders
      cy.contains('Kanban Board').should('be.visible');
      cy.contains('To Do').should('be.visible');
      cy.contains('In Progress').should('be.visible');

      // Assert: All tasks populate in the correct columns
      cy.contains('To Do').parent().within(() => {
        cy.contains('Set up project').should('exist');
        cy.contains('Create tasks endpoint').should('exist');
      });

      cy.contains('Blocked').parent().within(() => {
        cy.contains('Write docs').should('exist');
      });

      // ===== STEP 3: Open Task from To-Do =====
      cy.contains('Set up project').click();

      cy.wait('@getTaskDetail');
      cy.wait('@getComments');

      // Assert: Correct task details appear
      cy.contains('h1', 'Set up project').should('be.visible');
      cy.contains('Initialize repo, CI and migrations').should('be.visible');

      // ===== STEP 4: Add Comment =====
      cy.get('[testid="comments-textbox"]').type(newCommentText);
      cy.contains('button', 'Add Comment').click();

      cy.wait('@postComment');

      // Assert: Task comments are persistent (new comment visible)
      cy.contains(newCommentText).should('be.visible');

      // ===== STEP 5: Close Task (Navigate Back) =====
      cy.go('back');

      cy.wait('@getTasksProject1');

      cy.contains('Kanban Board').should('be.visible');

      // ===== STEP 6: Move Task to In Progress =====
      const dataTransfer = new DataTransfer();

      cy.contains('[data-testid="task-card"]', 'Set up project')
        .trigger('dragstart', { dataTransfer });

      cy.contains('In Progress')
        .parent()
        .find('[class*="flex-1"]')
        .first()
        .trigger('drop', { dataTransfer })
        .trigger('dragend', { dataTransfer });

      cy.wait('@updateTask');

      // Update task state to simulate persistence
      cy.updateTaskState(1, 1, { column_id: 3 });

      // Reload to verify persistence
      cy.reload();
      cy.wait('@authMe');
      cy.wait('@getTasksProject1');

      // Assert: Task moves from To-Do to In Progress and renders correctly
      cy.contains('In Progress').parent().within(() => {
        cy.contains('Set up project').should('exist');
      });

      // ===== STEP 7: Log Out =====
      cy.contains('Sign out').click();

      cy.wait('@logout');

      // Assert: When developer logs out, login page renders again
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });
});
