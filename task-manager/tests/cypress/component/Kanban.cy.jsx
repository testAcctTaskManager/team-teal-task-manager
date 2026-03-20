import Board from "../../../src/components/Board";
import { mountKanban } from "../support/component";

describe("Board component", () => {
    
    
    it("renders empty when there are no columns", () => {
        const columns = [];
        cy.mount(<Board columns={columns} boardTitle="Board" emptyColumnsText="No Columns" />);
        cy.get("p").contains("No Columns").should("exist");
    });

    it("renders all five columns", () => {

        mountKanban();

        cy.contains("To Do").should("exist");
        cy.contains("Blocked").should("exist");
        cy.contains("In Progress").should("exist");
        cy.contains("In Review").should("exist");
        cy.contains("Complete").should("exist");
    });

    it("shows tasks in the correct column", () => {
        mountKanban();
         
        cy.contains("To Do").parent().within(() => {
            cy.contains("Set up project").should("exist");
            cy.contains("Create tasks endpoint").should("exist");
        });
        cy.contains("Blocked").parent().within(() => {
            cy.contains("Write docs").should("exist");
        });
    });

    // TODO: implement task filtering.
    //it("updates displayed tasks based on filter correctly", () => {
    //    
    //});
    
});