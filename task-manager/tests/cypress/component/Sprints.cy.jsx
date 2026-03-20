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

    const testSprints = [
        { id: "101", name: "Sprint 1", status: "not_started", project_id: 1},
        { id: "102", name: "Sprint 2", status: "in_progress", project_id: 1 }
    ];

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
                        sprints={testSprints}
                        columns={testColumns}
                        sprintId="101"
                        sprintStatus="not_started"
                        {...props}
                    />
                </MemoryRouter>
            </UsersContext.Provider>
        );
    };

    it("renders the sprint names from the API data in the dropdown", () => {
        mountSprintsTestComponent();
        cy.get("#sprint-selection").within(() => {
            cy.contains("Sprint 1").should("exist");
            cy.contains("Sprint 2").should("exist");
        });
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
        cy.get("button").should("have.text", "Not started");

        // Click to trigger handleSprintState
        cy.get("button").click();

        // Check that it calls the API update handler with 'in_progress'
        cy.get("@updateSprintStatus").should("have.been.calledWith", "in_progress");
    });

    it("disables the status button when the sprint status is 'complete'", () => {
        mountSprintsTestComponent({ sprintStatus: "complete" });
        
        cy.get("button")
            .should("have.text", "Completed")
            .and("be.disabled");
    });

    it("calls setSprintId when a different sprint is selected", () => {
        const setSprintIdSpy = cy.spy().as("setSprintId");
        
        mountSprintsTestComponent({ setSprintId: setSprintIdSpy });

        cy.get("#sprint-selection").select("102");
        
        cy.get("@setSprintId").should("have.been.calledWith", "102");
    });

    it("renders tasks for the sprint", () => {
        mountSprints();

        cy.contains("Sprints").should("be.visible");
        cy.contains("Set up project").should("be.visible");
        cy.contains("Create tasks endpoint").should("be.visible");
    });

    it("renders button with sprint status", () => {
        mountSprints();

        cy.contains("Not started").should("be.visible");
        cy.contains("Sprint 1").should("be.visible");
    })

    it("renders empty when there are no columns", () => {
        cy.mount(<Sprints columns={[]} boardTitle="Sprints"/>);
        
        cy.contains("No Sprints").should("be.visible");
    });

});