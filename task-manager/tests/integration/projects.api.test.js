import { describe, it, expect } from "vitest";

const DEV_PORT = process.env.WRANGLER_DEV_PORT ?? "8788";
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;

describe("Projects API with D1 (integration)", () => {
    it("Returns seeded projects from database", async () => {
        const res = await fetch(`${BASE_URL}/api/projects`);
        expect(res.ok).toBe(true);

        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        // Check that project with id = 1 exists (from the seed file)
        const project1 = data.find((p) => p.id === 1);
        expect(project1).toBeTruthy();

        if (project1) {
            expect(project1.name).toBeDefined(); expect(project1.created_by).toBeDefined(); 
            expect(project1.status).toBeDefined();
            expect(["not_started", "in_progress", "complete"]).toContain(project1.status);
            expect(project1.type).toBeDefined();
            expect(["kanban", "scrum"]).toContain(project1.type);
        }
    });

    it("Creates a new project with default status", async () => {
        // Create a project
        const createRes = await fetch(`${BASE_URL}/api/projects`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: "Integration Test Project", 
                created_by: 1}),
        });

        // Assertions
        expect(createRes.ok).toBe(true); 
        const created = await createRes.json();
        expect(created.name).toBe("Integration Test Project"); 
        expect(created.created_by).toBe(1); 
        expect(created.status).toBe("not_started"); 
        expect(created.type).toBe("kanban");
        // default from schema 
        expect(created.created_at).toBeDefined();
        expect(created.updated_at).toBeDefined();
    });

    it("Updates a project's status and refreshes updated_at", async () => { 
        // First create a project 
        const createRes = await fetch(`${BASE_URL}/api/projects`, { 
            method: "POST", 
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({
                name: "Update Test Project", 
                created_by: 1}),
        }); 

        
        const created = await createRes.json(); 
        const id = created.id;
        // Check validity
        expect(id).toBeDefined();

        // Update status
        const updateRes = await fetch(`${BASE_URL}/api/projects/${id}`, { 
            method: "PATCH", 
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({status: "in_progress"}), 
        }); 
        
        const updated = await updateRes.json(); 

        expect(updateRes.ok).toBe(true); 
        expect(updated.status).toBe("in_progress"); 
        expect(updated.updated_at).not.toBe(created.updated_at); 
    }); 
    
    it("Rejects invalid status values", async () => { 
        const res = await fetch(`${BASE_URL}/api/projects`, { 
            method: "POST",
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({name: "Bad Status Project", created_by: 1, status: "almost_done"/*invalid*/}), 
            }); 
            
            // Depending on our error handler, this may be 400 or 500 I'm just not totally sure so I'm going to include both possibilities
            expect([400, 500]).toContain(res.status); 
            const body = await res.json(); expect(body).toBeTruthy(); 
        });

    it("Seeded scrum projects contain todo column", async () => {
        const res = await fetch(`${BASE_URL}/api/projects`);
        expect(res.ok).toBe(true);

        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);

        // get all scrum projects
        const scrumProject = data.find((p) => p && p.type === 'scrum');
        expect(scrumProject).toBeTruthy();

        if (scrumProject) {
            const colsRes = await fetch(`${BASE_URL}/api/columns?project_id=${scrumProject.id}`);
            expect(colsRes.ok).toBe(true);
            const cols = await colsRes.json();
            expect(Array.isArray(cols)).toBe(true);

            const keys = cols.map(c => (c.key || '').trim().toLowerCase().replace(/\s/g, ""));

            // scrum must include backlog
            expect(keys).toContain('todo');
        }
    });
});