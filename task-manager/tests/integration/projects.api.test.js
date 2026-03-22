import { describe, it, expect } from "vitest";
import { authFetch, BASE_URL } from "./helpers.js";
import { DEFAULT_COLUMNS } from "../../functions/api/constants/defaultColumns.js";

describe("Projects API with D1 (integration)", () => {
    it("Returns seeded projects from database", async () => {
        const res = await authFetch(`${BASE_URL}/api/projects`);
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
        }
    });

    it("Creates a new project with default status", async () => {
        // Create a project
        const createRes = await authFetch(`${BASE_URL}/api/projects`, {
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
        // default from schema
        expect(created.created_at).toBeDefined();
        expect(created.updated_at).toBeDefined();
    });

    it("Updates a project's status and refreshes updated_at", async () => {
        // First create a project
        const createRes = await authFetch(`${BASE_URL}/api/projects`, {
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
        const updateRes = await authFetch(`${BASE_URL}/api/projects/${id}`, {
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
        const res = await authFetch(`${BASE_URL}/api/projects`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name: "Bad Status Project", created_by: 1, status: "almost_done"/*invalid*/}),
            });

            // Depending on our error handler, this may be 400 or 500 I'm just not totally sure so I'm going to include both possibilities
            expect([400, 500]).toContain(res.status);
            const body = await res.json(); expect(body).toBeTruthy();
        });

    it("Ensures no project has duplicate column names", async () => {
        const projectRes = await authFetch(`${BASE_URL}/api/projects`);
        expect(projectRes.ok).toBe(true);

        const projectData = await projectRes.json();
        expect(Array.isArray(projectData)).toBe(true);

        const normalizeName = (name) => String(name ?? "").trim().toLowerCase();

        for (const project of projectData) {
            const columnsRes = await authFetch(`${BASE_URL}/api/columns?project_id=${project.id}`);
            expect(columnsRes.ok).toBe(true);

            const columnsData = await columnsRes.json();
            expect(Array.isArray(columnsData)).toBe(true);

            const seenNames = new Set();

            for (const column of columnsData) {
                const normalizedName = normalizeName(column.name);
                expect(seenNames.has(normalizedName)).toBe(false);
                seenNames.add(normalizedName);
            }
        }
    });

    it("Auto-creates default Kanban columns when a new project is created", async () => {
        // Create a new project
        const createRes = await authFetch(`${BASE_URL}/api/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Auto-Column Test Project", created_by: 1 }),
        });

        expect(createRes.ok).toBe(true);
        const created = await createRes.json();
        expect(created.id).toBeDefined();

        // Fetch columns for the new project
        const colRes = await authFetch(
            `${BASE_URL}/api/columns?project_id=${created.id}`,
        );
        expect(colRes.ok).toBe(true);

        const columns = await colRes.json();
        expect(Array.isArray(columns)).toBe(true);
        expect(columns).toHaveLength(DEFAULT_COLUMNS.length);

        // Columns are ordered by position ASC from the API
        for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
            expect(columns[i].name).toBe(DEFAULT_COLUMNS[i].name);
            expect(columns[i].key).toBe(DEFAULT_COLUMNS[i].key);
            expect(columns[i].position).toBe(DEFAULT_COLUMNS[i].position);
            expect(columns[i].project_id).toBe(created.id);
        }
    });


});
