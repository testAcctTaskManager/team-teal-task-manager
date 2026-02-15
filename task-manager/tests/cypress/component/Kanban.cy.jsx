import Kanban from "../../../src/components/Kanban";
import { mountKanban } from "../support/component";

describe("Kanban component", () => {
    
    
    it("renders empty when there are no columns", () => {
        const columns = [];
        cy.mount(<Kanban columns={columns}/>)
        cy.get("body").contains("No Columns")
    });

    it("renders all five columns", () => {

        mountKanban();

        cy.contains("To Do").should("be.visible")
        cy.contains("Blocked").should("be.visible")
        cy.contains("In Progress").should("be.visible")
        cy.contains("In Review").should("be.visible")
        cy.contains("Complete").should("be.visible")
    });

    it("shows tasks in the correct column", () => {
        
    });

    it("updates displayed tasks based on filter correctly", () => {
        
    });
});