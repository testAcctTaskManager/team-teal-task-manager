import Sprints from "../../../src/components/Sprints";
import { mountSprints } from "../support/component";

describe("Sprint component", () => {

    it("renders tasks for the sprint", () => {
        mountSprints();

        cy.contains("Sprints").should("be.visible");
        cy.contains("Set up project").should("be.visible");
        cy.contains("Create tasks endpoint").should("be.visible");
    });
});