/// <reference types="cypress" />

import { mountTaskDetail } from "../support/component.jsx";

// Basic happy-path rendering of TaskDetail with a task and comments
describe("TaskDetail component", () => {
  const taskId = "42";

  it("renders task details and existing comments", () => {
    cy.intercept("GET", "**/api/tasks/*", {
      statusCode: 200,
      body: {
        id: Number(taskId),
        title: "Test Task",
        description: "This is a test task.",
        project_id: 1,
        sprint_id: 2,
        reporter_id: 3,
        assignee_id: 4,
        created_by: "alice",
        modified_by: "bob",
        start_date: "2025-01-01T00:00:00.000Z",
        due_date: "2099-01-10T00:00:00.000Z",
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-02T00:00:00.000Z",
      },
    }).as("getTask");

    cy.intercept("GET", "**/api/comments*", {
      statusCode: 200,
      body: [
        {
          id: 1,
          task_id: Number(taskId),
          content: "First comment",
          created_by: "alice",
          created_at: "2025-01-03T00:00:00.000Z",
        },
      ],
    }).as("getComments");

    mountTaskDetail(`/task/${taskId}`);

    cy.contains("h1", "Test Task").should("be.visible");
    cy.contains("This is a test task.").should("be.visible");

    cy.contains("Project").siblings("dd").should("contain", "1");
    cy.contains("Sprint").siblings("dd").should("contain", "2");
    cy.contains("Assignee").siblings("dd").should("contain", "4");
    cy.contains("Reporter").siblings("dd").should("contain", "3");

    cy.contains("First comment").should("be.visible");
    cy.contains("alice").should("exist");
  });


    it("shows loading and error states for task and comments", () => {
        cy.intercept("GET", "**/api/tasks/*", {
        statusCode: 500,
        body: { error: "boom" },
        }).as("getTaskError");

        cy.intercept("GET", "**/api/comments*", {
        statusCode: 500,
        body: { error: "boom" },
        }).as("getCommentsError");

        mountTaskDetail(`/task/${taskId}`);

        cy.wait("@getTaskError");
        cy.wait("@getCommentsError");

        cy.contains("Unable to load task from server.").should("be.visible");
        cy.contains("Unable to load comments from server.").should("be.visible");
    });



  it("adds a new comment when posting succeeds", () => {
    cy.intercept("GET", "**/api/tasks/*", {
      statusCode: 200,
      body: {
        id: Number(taskId),
        title: "Task for comments",
      },
    }).as("getTask");

    cy.intercept("GET", "**/api/comments*", {
      statusCode: 200,
      body: [],
    }).as("getComments");

    cy.intercept("POST", "/api/comments", (req) => {
      expect(req.body).to.include({
        task_id: taskId,
      });
      req.reply({
        statusCode: 200,
        body: {
          id: 100,
          task_id: Number(taskId),
          content: "New comment from Cypress",
          created_by: "alice",
          created_at: "2025-01-04T00:00:00.000Z",
        },
      });
    }).as("postComment");

    mountTaskDetail(`/task/${taskId}`);

    cy.contains("No comments yet.").should("be.visible");

    cy.get("textarea.comments-textbox").type("New comment from Cypress");
    cy.contains("button", "Add Comment").click();

    cy.wait("@postComment");

    cy.contains("New comment from Cypress").should("be.visible");
    cy.get("textarea.comments-textbox").should("have.value", "");
  });

  it("appends new comment to existing comments list", () => {
    cy.intercept("GET", "**/api/tasks/*", {
      statusCode: 200,
      body: {
        id: Number(taskId),
        title: "Task with comments",
      },
    }).as("getTask");

    cy.intercept("GET", "**/api/comments*", {
      statusCode: 200,
      body: [
        {
          id: 1,
          task_id: Number(taskId),
          content: "Existing comment",
          created_by: "alice",
          created_at: "2025-01-03T00:00:00.000Z",
        },
      ],
    }).as("getComments");

    cy.intercept("POST", "/api/comments", (req) => {
      expect(req.body).to.include({
        task_id: taskId,
      });
      req.reply({
        statusCode: 200,
        body: {
          id: 2,
          task_id: Number(taskId),
          content: "Second comment",
          created_by: "bob",
          created_at: "2025-01-04T00:00:00.000Z",
        },
      });
    }).as("postComment");

    mountTaskDetail(`/task/${taskId}`);

    cy.contains("Existing comment").should("be.visible");

    cy.get("textarea.comments-textbox").type("Second comment");
    cy.contains("button", "Add Comment").click();

    cy.wait("@postComment");

    cy.contains("Existing comment").should("be.visible");
    cy.contains("Second comment").should("be.visible");
  });
});
