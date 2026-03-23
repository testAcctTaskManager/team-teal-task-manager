import { MemoryRouter } from "react-router-dom";
import OldSprints from "../../../src/components/OldSprints";
import { UsersContext } from "../../../src/contexts/UsersContext";

describe("OldSprints Component", () => {
  const testUserValue = {
    users: [
      { id: 1, display_name: "Alice Developer", email: "alice@example.com" },
      { id: 2, display_name: "Bob Tester", email: "bob@example.com" },
    ],
    loading: false,
    currentUser: { id: 1, email: "alice@example.com", display_name: "Alice Developer" },
    isAuthenticated: true,
  };

  const completedSprints = [
    { id: 1, name: "Sprint 1", status: "complete" },
    { id: 2, name: "Sprint 2", status: "complete" },
  ];

  const allTasks = [
    { id: 10, title: "Write tests", sprint_id: 1, assignee_id: 1, due_date: "2026-01-10" },
    { id: 11, title: "Fix login bug", sprint_id: 1, assignee_id: 2, due_date: null },
    { id: 12, title: "Design UI", sprint_id: 2, assignee_id: 1, due_date: "2026-02-15" },
  ];

  const mount = (props = {}) => {
    cy.mount(
      <UsersContext.Provider value={testUserValue}>
        <MemoryRouter>
          <OldSprints
            sprints={completedSprints}
            allTasks={allTasks}
            {...props}
          />
        </MemoryRouter>
      </UsersContext.Provider>
    );
  };

  it("shows empty state when there are no completed sprints", () => {
    mount({ sprints: [] });
    cy.contains("No completed sprints yet.").should("exist");
  });

  it("shows empty state when all sprints are not yet complete", () => {
    const activeSprints = [
      { id: 1, name: "Sprint 1", status: "in_progress" },
      { id: 2, name: "Sprint 2", status: "not_started" },
    ];
    mount({ sprints: activeSprints });
    cy.contains("No completed sprints yet.").should("exist");
  });

  it("renders a completed sprint's name", () => {
    mount({ sprints: [completedSprints[0]], allTasks });
    cy.contains("Sprint 1").should("exist");
  });

  it("renders tasks belonging to a completed sprint", () => {
    mount({ sprints: [completedSprints[0]], allTasks });
    cy.contains("Write tests").should("exist");
    cy.contains("Fix login bug").should("exist");
  });

  it("does not show tasks from a different sprint", () => {
    mount({ sprints: [completedSprints[0]], allTasks });
    cy.contains("Design UI").should("not.exist");
  });

  it("shows all completed sprints", () => {
    mount();
    cy.contains("Sprint 1").should("exist");
    cy.contains("Sprint 2").should("exist");
  });

  it("shows most recent sprint first (descending order)", () => {
    mount();
    cy.get("h2").then(($headings) => {
      const names = $headings.map((_, el) => el.textContent).get();
      expect(names[0]).to.equal("Sprint 2");
      expect(names[1]).to.equal("Sprint 1");
    });
  });

  it("shows task count in sprint header", () => {
    mount({ sprints: [completedSprints[0]], allTasks });
    cy.contains("2 tasks").should("exist");
  });

  it("shows empty state message inside a sprint with no tasks", () => {
    mount({ sprints: [completedSprints[0]], allTasks: [] });
    cy.contains("No tasks completed in this sprint.").should("exist");
  });

  it("shows singular 'task' for a sprint with exactly one task", () => {
    const singleTask = [{ id: 10, title: "Write tests", sprint_id: 1, assignee_id: 1, due_date: null }];
    mount({ sprints: [completedSprints[0]], allTasks: singleTask });
    cy.contains("1 task").should("exist");
    cy.contains("1 tasks").should("not.exist");
  });
});
