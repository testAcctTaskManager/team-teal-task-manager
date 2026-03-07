import { mountProjectSelector } from "../support/component";

const projects = [
  { id: 1, name: "Project One" },
  { id: 2, name: "Project Two" },
];

describe("ProjectSelector Component", () => {
    it("shows empty state when no projects exist", () => {
        mountProjectSelector([]);

        cy.contains("No Projects Available").should("be.visible");
    });

    it("renders project options and allows selection", () => {
        mountProjectSelector(projects);

        cy.contains("Select Project").should("be.visible");
        cy.contains("Project One").should("not.exist");
        cy.contains("Project Two").should("not.exist");
    });

    it("allows project selection", () => {
        mountProjectSelector(projects, null, cy.stub().as("onSelectProject"));

        cy.contains("Select Project").click();
        cy.contains("Project One").click();

        cy.get("@onSelectProject").should("have.been.calledWith", 1);
    });

});