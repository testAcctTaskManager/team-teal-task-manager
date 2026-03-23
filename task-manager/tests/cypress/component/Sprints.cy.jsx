import { MemoryRouter } from "react-router-dom";
import Sprints from "../../../src/components/Sprints";
import { UsersContext } from "../../../src/contexts/UsersContext";
import { mountSprints } from "../support/component";

describe("Sprint Component", () => {

    const testUserValue = {
        users: [],
        loading: false,
        currentUser: { id: 1, email: "test@example.com", display_name: "Test User" },
        isAuthenticated: true,
    };

    const testColumns = [
        {
            id: 1,
            title: "To Do",
            tasks: [{ id: 50, title: "API Integration", position: 0, column_id: 1 }]
        }
    ];

    const mountSprintsTestComponent = (props = {}) => {
        cy.intercept("PUT", "/api/tasks/*", { statusCode: 200, body: { success: true }
        }).as("updateTask");

        cy.mount(
            <UsersContext.Provider value={testUserValue}>
                <MemoryRouter>
                    <Sprints
                        columns={testColumns}
                        sprintStatus="not_started"
                        sprintName="Sprint 1"
                        {...props}
                    />
                </MemoryRouter>
            </UsersContext.Provider>
        );
    };

    it("shows the sprint name when provided", () => {
        mountSprintsTestComponent();
        cy.contains("Sprint 1").should("exist");
    });

    it("shows the 'No Sprints' empty state when no columns exist", () => {
        mountSprintsTestComponent({ columns: [] });
        cy.contains("No Sprints").should("exist");
    });

    it("handles the sprint status transition logic", () => {
        const updateSpy = cy.spy().as("updateSprintStatus");

        mountSprintsTestComponent({
            sprintStatus: "not_started",
            updateSprintStatus: updateSpy
        });

        // Verify initial button state
        cy.get("button").should("have.text", "Start Sprint");

        // Click to trigger handleSprintState
        cy.get("button").click();

        // Check that it calls the API update handler with 'in_progress'
        cy.get("@updateSprintStatus").should("have.been.calledWith", "in_progress");
    });

    it("shows 'Complete Sprint' button when sprint is in_progress", () => {
        const updateSpy = cy.spy().as("updateSprintStatus");
        mountSprintsTestComponent({ sprintStatus: "in_progress", updateSprintStatus: updateSpy });

        cy.get("button").should("have.text", "Complete Sprint");

        cy.get("button").click();
        cy.get("@updateSprintStatus").should("have.been.calledWith", "complete");
    });

    it("shows 'Create New Sprint' button when no sprint exists", () => {
        const createSpy = cy.spy().as("createSprint");
        mountSprintsTestComponent({ sprintName: null, sprintStatus: null, createSprint: createSpy });

        cy.get("button").should("have.text", "Create New Sprint");

        cy.get("button").click();
        cy.get("@createSprint").should("have.been.called");
    });

    it("renders tasks for the sprint", () => {
        mountSprints();

        cy.contains("Sprints").should("be.visible");
        cy.contains("Set up project").should("be.visible");
        cy.contains("Create tasks endpoint").should("be.visible");
    });

    it("renders button with 'Start Sprint' for not_started sprint", () => {
        mountSprints();

        cy.contains("Start Sprint").should("be.visible");
        cy.contains("Sprint 1").should("be.visible");
    });

    it("renders empty when there are no columns", () => {
        cy.mount(<Sprints columns={[]} boardTitle="Sprints"/>);

        cy.contains("No Sprints").should("be.visible");
    });

});
