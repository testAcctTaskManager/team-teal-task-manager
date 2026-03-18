import Sprints from "../../../src/components/Sprints";
import { mountSprints } from "../support/component";

describe("Sprint component", () => {

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