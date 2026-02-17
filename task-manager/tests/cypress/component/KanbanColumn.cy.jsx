import { mountKanbanColumn } from "../support/component";

const tasks = [
  {
    id: 1,
    title: "Set up project",
    reporter_id: 1,
    assignee_id: 2,
    start_date: "2026-01-02",
    due_date: "2026-01-04"
  },
  {
    id: 2,
    title: "Create tasks endpoint",
    reporter_id: 1,
    assignee_id: 2,
    start_date: "2026-01-03",
    due_date: "2026-01-07"
  }
];

describe("KanbanColumn Test", () => {
  it("shows empty state when no tasks exist", () => {
    mountKanbanColumn([]);

    cy.contains("No Tasks").should("be.visible");
  });

  it("renders tasks when provided", () => {
    mountKanbanColumn(tasks);

    cy.contains("Set up project").should("exist");
    cy.contains("Create tasks endpoint").should("exist");

    cy.contains("No Tasks").should("not.exist");
  });
});
