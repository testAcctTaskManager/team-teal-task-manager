/// <reference types="cypress" />

describe('Sprint Creation Workflow', () => {
  beforeEach(() => {
    cy.loginAs('developer');
  });

  it('creates task in backlog and displays it correctly', () => {
    const taskTitle = `my cool task ${Date.now()}`;

    // login -> dashboard -> select scrum project -> go to backlog -> create new task
    cy.goToBoard();
    cy.selectProject('Scrum Sample Project');
    cy.contains('button', 'Backlog').click();
    cy.contains('Sprints').should('be.visible');
    cy.get('#sprint-selection').should('be.visible');
    cy.contains('button', 'New Task').click();
    cy.get('input[name="title"]').type(taskTitle);
    cy.get('textarea[name="description"]').type('my cool task description');
    cy.contains('button', 'Create').click();

    // assertion: task displays properly
    cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');
  });
})