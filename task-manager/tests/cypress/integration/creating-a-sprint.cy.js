/// <reference types="cypress" />

describe('Sprint Creation Workflow', () => {
  beforeEach(() => {
    cy.loginAs('developer');
  });

  it('creates task in backlog and displays it correctly', () => {
    const taskTitle = `my cool backlog task ${Date.now()}`;

    // login -> dashboard -> select scrum project -> go to backlog -> create new task
    cy.goToBoard();
    cy.selectProject('Scrum Sample Project');
    cy.contains('button', 'Backlog').click();
    cy.contains('Sprints').should('be.visible');
    cy.get('#sprint-selection').should('be.visible');
    cy.contains('button', 'New Task').click();
    cy.get('input[name="title"]').type(taskTitle);
    cy.get('textarea[name="description"]').type('my cool backlog task description');
    cy.contains('button', 'Create').click();

    // assertion: task displays properly in backlog
    cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');
  });

  it('assigns task to sprint and displays it in sprint section', () => {
    const taskTitle = `my cool backlog task ${Date.now()}`;

    // login -> dashboard -> select scrum project -> go to backlog -> create new task -> assign to sprint
    // -> select sprint
    cy.goToBoard();
    cy.selectProject('Scrum Sample Project');
    cy.contains('button', 'Backlog').click();
    cy.contains('Sprints').should('be.visible');
    cy.get('#sprint-selection').should('be.visible');
    cy.contains('button', 'New Task').click();
    cy.get('input[name="title"]').type(taskTitle);
    cy.get('textarea[name="description"]').type('my cool backlog task description');
    cy.get('input[name="sprint_id"]').clear().type('2');
    cy.contains('button', 'Create').click();
    cy.get('#sprint-selection').select('2');

    // assertion: task appears in sprint 1 (id is 2)
    cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');
  });

  it('displays sprint tasks on scrum board when sprint is active', () => {
    // login -> dashboard -> select scrum project 
    cy.goToBoard();
    cy.selectProject('Scrum Sample Project');
    cy.contains('Scrum Board').should('be.visible');
    cy.contains('to do').should('be.visible');
    cy.contains('in progress').should('be.visible');

    // assertion: at least one task card exists on board
    cy.get('[data-testid="task-card"]').should('exist');
  });
});