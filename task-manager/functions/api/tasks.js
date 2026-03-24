import {
  makeCrudHandlers,
  parseJson,
  queryOne,
  insertInto,
  buildCorsHeaders,
} from "./helpers.js";

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
    "due_date",
    "position",
  ],
  dbEnvVar: "cf_db",
  orderBy: "id",
};

const handlers = makeCrudHandlers(config);

export const onRequestGet = handlers.collection;
export const onRequestOptions = handlers.collection;

export async function onRequestPost(context) {
  const { request, env, data } = context;

  // Delegate non-POSTs to the default collection handler
  if (request.method !== "POST") return handlers.collection(context);

  const db = env[config.dbEnvVar];
  const CORS = buildCorsHeaders(env, request, "GET,POST,OPTIONS");
  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!db)
      return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: CORS,
      });

    const body = await parseJson(request);
    const callerId = Number(data?.user?.id);
    if (!Number.isFinite(callerId)) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: CORS,
      });
    }

    // Audit fields are always derived from the authenticated caller.
    body.created_by = callerId;
    body.modified_by = callerId;

    // Keep reporter user-selectable, but default to caller when omitted.
    if (body.reporter_id === undefined || body.reporter_id === null) {
      body.reporter_id = callerId;
    }

    // If no explicit position provided, and we have a column_id, compute next position
    if (body.position === undefined && body.column_id !== undefined) {
      try {
        const row = await queryOne(
          db,
          "SELECT COALESCE(MAX(position), -1) AS maxpos FROM Tasks WHERE column_id = ?",
          [body.column_id],
        );
        const maxpos =
          row && Number.isFinite(Number(row.maxpos)) ? Number(row.maxpos) : -1;
        body.position = maxpos + 1;
      } catch (err) {
        // If the `position` column doesn't exist in the DB, fall back to position 0
        console.warn(
          "Could not compute max(position) — falling back to position 0",
          err && err.stack ? err.stack : err,
        );
        body.position = 0;
      }
    }

    if (body.sprint_id !== undefined && body.sprint_id !== null) {
      const sprint = await queryOne(db, `SELECT id FROM Sprints WHERE id = ?`, [
        body.sprint_id,
      ]);
      if (!sprint) {
        return new Response(JSON.stringify({ error: "Sprint not found" }), {
          status: 400,
          headers: CORS,
        });
      }
    }

    // Choose columns from allowedColumns if provided (but only those present in body), otherwise from body keys
    const payloadCols =
      config.allowedColumns && config.allowedColumns.length
        ? config.allowedColumns.filter((c) => body[c] !== undefined)
        : Object.keys(body || {}).filter((k) => body[k] !== undefined);
    await insertInto(
      db,
      config.table,
      payloadCols,
      payloadCols.map((c) => body[c]),
    );
    const created = await queryOne(
      db,
      `SELECT * FROM ${config.table} WHERE ${config.primaryKey} = last_insert_rowid()`,
    );
    return new Response(JSON.stringify(created || {}), {
      status: 201,
      headers: CORS,
    });
  } catch (err) {
    console.error(
      `/api/${config.table} collection POST error:`,
      err && err.stack ? err.stack : err,
    );
    return new Response(
      JSON.stringify({ error: String(err || "Internal error") }),
      { status: 500, headers: CORS || { "Content-Type": "application/json" } },
    );
  }
}
