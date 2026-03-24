/// <reference types="cypress" />

import { seedData } from '../support/integration.js';

/**
 * Clinician Creates A Task Workflow Integration Test
 *
 * This test covers the complete clinician workflow using REAL API calls
 * against the Wrangler + D1 backend (no mocking).
 *
 * Workflow:
 * 1. Clinician login
 * 2. Click the Clinician Dashboard nav link
 * 3. Click + New Request button
 * 4. Fill out new task form, selecting a specific project
 * 5. See the clinician dashboard render after creation
 * 6. Click on Kanban nav link
 * 7. Select same project we made a task for (Demo Project 1)
 * 8. Click Backlog tab
 * 9. See the task in the backlog (tasks created via ClinicianForm have column_id: null)
 * 10. Log out and verify login page renders
 *
 * Note: uses loginAs('mutable') because this test creates tasks (data mutation).
 * loginAs('clinician') is not defined in the integration framework.
 */

describe('Clinician Creates a Task Workflow', () => {
  // Unique title per test — reset in beforeEach so each test gets its own
  let taskTitle;

  beforeEach(() => {
    taskTitle = `Clinician Request ${Date.now()}`;
    cy.loginAs('mutable');
  });

  // Clinician Dashboard Access 

  describe('Clinician Dashboard Access', () => {
    it('shows the clinician dashboard when Clinician nav link is clicked', () => {
      cy.goToBoard();
      cy.contains('Clinician').click();

      cy.url().should('include', '/clinician');
      cy.contains('Clinician Requests').should('be.visible');
      cy.contains('+ New Request').should('be.visible');
    });
  });

  // New Request Form

  describe('Creating a New Request', () => {
    it('opens the create request modal when + New Request is clicked', () => {
      cy.visit('/clinician');
      cy.contains('+ New Request').click();

      cy.contains('Create Clinician Request').should('be.visible');
      cy.contains('button', 'Create Request').should('be.visible');
      cy.contains('button', 'Cancel').should('be.visible');
    });

    it('shows validation errors when required fields are empty', () => {
      cy.visit('/clinician');
      cy.contains('+ New Request').click();

      // Submit without filling anything in
      cy.contains('button', 'Create Request').click();

      // Title and Project are required
      cy.contains('This field is required').should('be.visible');
    });

    it('dismisses the modal when Cancel is clicked', () => {
      cy.visit('/clinician');
      cy.contains('+ New Request').click();
      cy.contains('Create Clinician Request').should('be.visible');

      cy.contains('button', 'Cancel').click();

      cy.contains('Create Clinician Request').should('not.exist');
    });

    it('successfully creates a request and closes the modal', () => {
      cy.visit('/clinician');
      cy.contains('+ New Request').click();

      // Fill out the form
      cy.get('input[name="title"]').type(taskTitle);
      cy.get('textarea[name="description"]').type('A test clinician request');
      cy.get('select[name="project_id"]').select(seedData.projects.demo1.name);

      cy.contains('button', 'Create Request').click();

      // Modal should close on success
      cy.contains('Create Clinician Request').should('not.exist');
      // Still on the clinician dashboard
      cy.contains('Clinician Requests').should('be.visible');

      // Cleanup: delete the task we just created
      cy.request('GET', '/api/tasks').then((response) => {
        const task = response.body.find((t) => t.title === taskTitle);
        if (task) cy.request('DELETE', `/api/tasks/${task.id}`);
      });
    });
  });

  // Task Appears in Kanban Backlog

  describe('Task Appears in Kanban Backlog', () => {
    it('newly created clinician request appears in the project backlog', () => {
      // Create the request via the UI form
      cy.visit('/clinician');
      cy.contains('+ New Request').click();
      cy.get('input[name="title"]').type(taskTitle);
      cy.get('select[name="project_id"]').select(seedData.projects.demo1.name);
      cy.contains('button', 'Create Request').click();
      cy.contains('Create Clinician Request').should('not.exist');

      // Navigate to Kanban board
      cy.contains('Kanban').click();
      cy.waitForBoardLoad();

      // Demo Project 1 should be pre-selected (matches what we created the task for)
      cy.contains(seedData.projects.demo1.name).should('be.visible');

      // Switch to Backlog tab — clinician form creates tasks with column_id: null
      cy.contains('button', 'Backlog').click();

      // Assert: created task is visible in the backlog
      cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');

      // Cleanup: delete the task we just created
      cy.request('GET', '/api/tasks').then((response) => {
        const task = response.body.find((t) => t.title === taskTitle);
        if (task) cy.request('DELETE', `/api/tasks/${task.id}`);
      });
    });
  });

  // Logout Flow 

  describe('Logout Flow', () => {
    it('returns to login page when clinician logs out', () => {
      cy.visit('/clinician');
      cy.performLogout();

      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });

  // Full Clinician Workflow

  describe('Full Clinician Workflow Integration', () => {
    it('completes the full clinician creates a task workflow', () => {
      // ===== STEP 1: Login & Navigate to Clinician Dashboard =====
      cy.goToBoard();
      cy.contains('Clinician').click();
      cy.url().should('include', '/clinician');
      cy.contains('Clinician Requests').should('be.visible');

      // ===== STEP 2: Click + New Request =====
      cy.contains('+ New Request').click();
      cy.contains('Create Clinician Request').should('be.visible');

      // ===== STEP 3 & 4: Fill Out Form and Submit =====
      cy.get('input[name="title"]').type(taskTitle);
      cy.get('textarea[name="description"]').type('A test clinician request');
      cy.get('select[name="project_id"]').select(seedData.projects.demo1.name);
      cy.contains('button', 'Create Request').click();

      // ===== STEP 5: Clinician Dashboard Renders After Creation =====
      cy.contains('Create Clinician Request').should('not.exist');
      cy.contains('Clinician Requests').should('be.visible');

      // ===== STEP 6: Navigate to Kanban =====
      cy.contains('Kanban').click();
      cy.waitForBoardLoad();

      // ===== STEP 7: Same Project is Pre-selected =====
      cy.contains(seedData.projects.demo1.name).should('be.visible');

      // ===== STEP 8: Click Backlog Tab =====
      cy.contains('button', 'Backlog').click();

      // ===== STEP 9: See Task in Backlog =====
      // ClinicianForm creates tasks with column_id: null — they land in the Backlog
      cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');

      // Cleanup: delete the task we just created (must happen before logout clears the cookie)
      cy.request('GET', '/api/tasks').then((response) => {
        const task = response.body.find((t) => t.title === taskTitle);
        if (task) cy.request('DELETE', `/api/tasks/${task.id}`);
      });

      // ===== STEP 10: Logout =====
      cy.performLogout();
      cy.url().should('include', '/login');
      cy.contains('Sign in').should('be.visible');
    });
  });
});
