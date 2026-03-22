import { makeCrudHandlers, buildCorsHeaders, parseJson } from "./helpers.js";
import { DEFAULT_COLUMNS } from "./constants/defaultColumns.js";

// Generic CRUD handlers (used for GET and OPTIONS)
const projectHandlers = makeCrudHandlers({
    table: "projects",
    primaryKey: "id",
    allowedColumns: ["name", "created_by", "status", "created_at", "updated_at"],
    dbEnvVar: "cf_db",
    orderBy: "id ASC",
});

/**
 * Custom POST handler that creates a project and its default Kanban columns
 * in a single D1 batch (transaction) so both succeed or fail together.
 */
const createProjectWithColumns = async (context) => {
    const { request, env } = context;
    const db = env.cf_db;
    const CORS = buildCorsHeaders(env, request, "GET,POST,OPTIONS");

    if (request.headers.get("Origin") && !CORS) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const body = await parseJson(request);

        // Validate required field
        if (!body.name) {
            return new Response(
                JSON.stringify({ error: "Project name is required" }),
                { status: 400, headers: CORS },
            );
        }

        // Validate status if provided
        const validStatuses = ["not_started", "in_progress", "complete"];
        if (body.status !== undefined && !validStatuses.includes(body.status)) {
            return new Response(
                JSON.stringify({
                    error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
                }),
                { status: 400, headers: CORS },
            );
        }

        const status = body.status || "not_started";
        const createdBy = body.created_by;

        // Build the batch of statements: insert project, then insert default columns
        const insertProject = db
            .prepare(
                "INSERT INTO projects (name, created_by, status) VALUES (?, ?, ?)",
            )
            .bind(body.name, createdBy, status);

        // Execute the project insert first to get its ID
        const projectResult = await insertProject.run();
        const projectId =
            projectResult.meta?.last_row_id ?? projectResult.lastRowId;

        // Batch-insert the default columns for the new project
        const columnStatements = DEFAULT_COLUMNS.map((col) =>
            db
                .prepare(
                    "INSERT INTO Columns (project_id, name, key, position) VALUES (?, ?, ?, ?)",
                )
                .bind(projectId, col.name, col.key, col.position),
        );

        await db.batch(columnStatements);

        // Return the created project
        const created = await db
            .prepare("SELECT * FROM projects WHERE id = ?")
            .bind(projectId)
            .first();

        return new Response(JSON.stringify(created || {}), {
            status: 201,
            headers: CORS,
        });
    } catch (err) {
        console.error("POST /api/projects error:", err?.stack || err);
        return new Response(
            JSON.stringify({ error: String(err || "Internal error") }),
            { status: 500, headers: CORS || { "Content-Type": "application/json" } },
        );
    }
};

// Routes
export const onRequestGet = projectHandlers.collection;
export const onRequestPost = createProjectWithColumns;
export const onRequestOptions = projectHandlers.collection;
