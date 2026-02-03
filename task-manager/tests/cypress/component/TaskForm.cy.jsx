/// <reference types="cypress" />

import { mountTaskForm } from "../support/component.jsx";

describe("TaskForm component", () => {
  it("creates a new task and links it to a column when columnId is provided", () => {
    cy.intercept("POST", "/api/tasks", (req) => {
      expect(req.body).to.include({
        title: "New Cypress Task",
        project_id: 1,
        created_by: "alice",
        modified_by: "alice",
      });

      req.reply({
        statusCode: 200,
        body: {
          id: 123,
          title: "New Cypress Task",
        },
      });
    }).as("createTask");

    cy.intercept("POST", "/api/column_tasks", (req) => {
      expect(req.body).to.deep.equal({
        column_id: 5,
        task_id: 123,
      });

      req.reply({
        statusCode: 200,
        body: { success: true },
      });
    }).as("linkColumn");

    const { onSuccess } = mountTaskForm({ columnId: 5 });

    cy.get('input[name="title"]').type("New Cypress Task", { force: true });

    cy.contains("button", "Create Task").click({ force: true });

    cy.wait("@createTask");
    cy.wait("@linkColumn");

    cy.contains("Task created.").should("be.visible");

    cy.wrap(onSuccess).should("have.been.calledOnce");
    cy.wrap(onSuccess).its("firstCall.args.0").should("include", { id: 123 });
  });

  it("loads an existing task in edit mode and saves changes", () => {
    const taskId = 42;

    cy.intercept("GET", "**/api/tasks/*", {
      statusCode: 200,
      body: {
        id: taskId,
        title: "Existing Task",
        description: "Existing description",
        sprint_id: 1,
        reporter_id: 2,
        assignee_id: 3,
        start_date: "2025-01-01",
        due_date: "2025-01-10",
      },
    }).as("getTask");

    cy.intercept("PUT", "**/api/tasks/*", (req) => {
      expect(req.body).to.include({
        title: "Updated Task Title",
        description: "Existing description",
        sprint_id: 1,
        reporter_id: 2,
        assignee_id: 3,
        project_id: 1,
        created_by: "alice",
        modified_by: "alice",
      });

      req.reply({
        statusCode: 200,
        body: { id: taskId, ...req.body },
      });
    }).as("updateTask");

    const { onSuccess } = mountTaskForm({ taskId });

    cy.wait("@getTask");

    cy.get('input[name="title"]').should("have.value", "Existing Task");

    cy.get('input[name="title"]').clear({ force: true }).type(
      "Updated Task Title",
      { force: true }
    );
    cy.contains("button", "Save Changes").click({ force: true });

    cy.wait("@updateTask");
    cy.contains("Task updated.").should("be.visible");

    cy.wrap(onSuccess).should("have.been.calledOnce");
  });

  it("validates that due date is not before start date", () => {
    cy.intercept("POST", "/api/tasks").as("createTask");

    mountTaskForm();

    cy.get('input[name="title"]').type("Task with bad dates", { force: true });
    cy.get('input[name="start_date"]').type("2025-01-10", { force: true });
    cy.get('input[name="due_date"]').type("2025-01-05", { force: true });

    cy.contains("button", "Create Task").click({ force: true });

    cy.contains("Due date must be on or after start date").should(
      "be.visible"
    );

    cy.get("@createTask.all").should("have.length", 0);
  });

  it("creates a new task without columnId and does not link to column", () => {
    cy.intercept("POST", "/api/tasks", (req) => {
      expect(req.body).to.include({
        title: "Task without column",
        project_id: 1,
        created_by: "alice",
        modified_by: "alice",
      });

      req.reply({
        statusCode: 200,
        body: {
          id: 456,
          title: "Task without column",
        },
      });
    }).as("createTask");

    cy.intercept("POST", "/api/column_tasks").as("linkColumn");

    mountTaskForm();

    cy.get('input[name="title"]').type("Task without column", {
      force: true,
    });

    cy.contains("button", "Create Task").click({ force: true });

    cy.wait("@createTask");

    cy.contains("Task created.").should("be.visible");
    cy.get("@linkColumn.all").should("have.length", 0);
  });

  it("does not call onSuccess when task creation fails", () => {
    cy.intercept("POST", "/api/tasks", {
      statusCode: 500,
      body: { error: "boom" },
    }).as("createTaskError");

    const { onSuccess } = mountTaskForm();

    cy.get('input[name="title"]').type("Will fail", { force: true });
    cy.contains("button", "Create Task").click({ force: true });

    cy.wait("@createTaskError");

    cy.contains("Task created.").should("not.exist");
    cy.wrap(onSuccess).should("not.have.been.called");
  });
});
