import {
  makeCrudHandlers,
  parseJson,
  queryOne,
  updateTable,
  buildCorsHeaders,
} from "../helpers.js";

const config = {
  table: "Tasks",
  primaryKey: "id",
  // these should maybe change -- a lot of these should be checked application-level
  allowedColumns: [
    "project_id",
    "column_id",
    "sprint_id",
    "reporter_id",
    "assignee_id",
    "created_by",
    "modified_by",
    "title",
    "description",
    "start_date",
    "end_date",
    "updated_at",
    "position",
  ],
  dbEnvVar: "cf_db",
  orderBy: "id",
};

const handlers = makeCrudHandlers(config);

export const onRequestGet = handlers.item;
export const onRequestPatch = handlers.item;
export const onRequestDelete = handlers.item;
export const onRequestOptions = handlers.item;

// Custom PUT handler so that when a task's column changes and no position
// is provided, the task is automatically appended to the bottom of the
// new column. When position is explicitly provided (e.g. from Kanban
// drag-and-drop), that value is respected.
export async function onRequestPut(context) {
  const { request, env, params } = context;

  // Delegate any non-PUT methods to the generic item handler
  if (request.method !== "PUT") return handlers.item(context);

  const id = params && (params.id || params[config.primaryKey]);
  const db = env[config.dbEnvVar];
  const CORS = buildCorsHeaders(
    env,
    request,
    "GET,PUT,PATCH,DELETE,OPTIONS",
  );

  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: CORS,
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: CORS,
      });
    }

    const body = await parseJson(request);

    // Load the existing task so we can detect column changes
    const existing = await queryOne(
      db,
      `SELECT column_id FROM ${config.table} WHERE ${config.primaryKey} = ?`,
      [id],
    );

    if (!existing) {
      return new Response(JSON.stringify({}), {
        status: 404,
        headers: CORS,
      });
    }

    // Build the updates object using allowedColumns (if provided) or body keys
    const updates = {};
    const candidates =
      config.allowedColumns && config.allowedColumns.length
        ? config.allowedColumns
        : Object.keys(body || {});

    candidates.forEach((col) => {
      if (body[col] !== undefined) updates[col] = body[col];
    });

    const cols = Object.keys(updates);
    if (cols.length === 0) {
      return new Response(JSON.stringify({ error: "Nothing to update" }), {
        status: 400,
        headers: CORS,
      });
    }

    // If no explicit position is provided and the column_id is changing to a
    // non-null value, append this task to the bottom of the new column.
    const originalColumnId = existing.column_id;
    const incomingColumnId =
      body.column_id !== undefined ? body.column_id : updates.column_id;

    const hasExplicitPosition = body.position !== undefined;

    if (!hasExplicitPosition && incomingColumnId !== undefined) {
      const oldNorm =
        originalColumnId === null || originalColumnId === undefined
          ? null
          : Number(originalColumnId);
      const newNorm =
        incomingColumnId === null || incomingColumnId === undefined
          ? null
          : Number(incomingColumnId);

      // Only compute a new position when actually moving *into* a column
      // (newNorm != null) and the column has changed.
      if (newNorm !== null && newNorm !== oldNorm) {
        try {
          const row = await queryOne(
            db,
            "SELECT COALESCE(MAX(position), -1) AS maxpos FROM Tasks WHERE column_id = ?",
            [incomingColumnId],
          );
          const maxpos =
            row && Number.isFinite(Number(row.maxpos))
              ? Number(row.maxpos)
              : -1;
          updates.position = maxpos + 1;
        } catch (err) {
          console.warn(
            "Could not compute max(position) on column change — falling back to position 0",
            err && err.stack ? err.stack : err,
          );
          updates.position = 0;
        }
      }
    }

    await updateTable(
      db,
      config.table,
      updates,
      `${config.primaryKey} = ?`,
      [id],
    );

    const updated = await queryOne(
      db,
      `SELECT * FROM ${config.table} WHERE ${config.primaryKey} = ?`,
      [id],
    );

    return new Response(JSON.stringify(updated || {}), { headers: CORS });
  } catch (err) {
    console.error(
      `/api/${config.table}/${id} PUT error:`,
      err && err.stack ? err.stack : err,
    );
    return new Response(
      JSON.stringify({ error: String(err || "Internal error") }),
      { status: 500, headers: CORS || { "Content-Type": "application/json" } },
    );
  }
}
