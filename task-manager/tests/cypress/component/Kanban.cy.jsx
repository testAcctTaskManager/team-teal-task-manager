import Kanban from "../../../src/components/Kanban";
import { mountKanban } from "../support/component";

describe("Kanban component", () => {
    
    
    it("renders empty when there are no columns", () => {
        const columns = [];
        cy.mount(<Kanban columns={columns}/>);
        cy.get("body").contains("No Columns").should("be.visible");
    });

    it("renders all five columns", () => {

        mountKanban();

        cy.contains("To Do").should("be.visible");
        cy.contains("Blocked").should("be.visible");
        cy.contains("In Progress").should("be.visible");
        cy.contains("In Review").should("be.visible");
        cy.contains("Complete").should("be.visible");
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