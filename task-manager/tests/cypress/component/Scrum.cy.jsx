import Scrum from "../../../src/components/Scrum";
import { MemoryRouter } from "react-router-dom";
import { UsersContext } from "../../../src/contexts/UsersContext";

describe("Scrum component", () => {
    const testUsersValue = {
        users: [],
        loading: false,
        currentUser: { id: 1, display_name: "Scrum Master" },
        isAuthenticated: true,
    };

    const testColumns = [
        {
            id: 1,
            title: "Backlog",
            tasks: [
                { id: 10, title: "Task 1", position: 0, column_id: 1 },
                { id: 11, title: "Task 2", position: 1, column_id: 1 }
            ]
        },
        {
            id: 2,
            title: "Done",
            tasks: []
        }
    ];

    const mountTestScrumComponent = (props ={}) => {
        cy.intercept("PUT", "/api/tasks/*", {
            statusCode: 200,
            body: { success: true }
        }).as("updateTaskApi");

        cy.mount(
            <UsersContext.Provider value={testUsersValue}>
                <MemoryRouter>
                    <Scrum
                        columns={testColumns}
                        setColumns={cy.stub().as("setColumnsStub")}
                        {...props}
                    />
                </MemoryRouter>
            </UsersContext.Provider>
        );
    };

    it("Renders the correct board title and empty state text", () => {
        mountTestScrumComponent();
        cy.get("h2").should("contain", "Scrum Board");

        mountTestScrumComponent({ columns: [] });
        cy.contains("No Columns").should("exist");
    });

    it("Renders columns and tasks correctly", () => {
        mountTestScrumComponent();
        cy.contains("Backlog").should("exist");
        cy.contains("Task 1").should("exist");
        cy.contains("Task 2").should("exist");
    });

    it("Renders the Scrum board without a status button", () => {
        mountTestScrumComponent();
        cy.get("h2").should("contain", "Scrum Board");
        cy.get("button").should("not.exist");
    });

    it("Passes the correct props to the Board component", () => {
        mountTestScrumComponent();
        cy.get("h2").should("have.text", "Scrum Board");
        cy.get(".flex.gap-4").should("not.have.class", "flex-col");
    });

});