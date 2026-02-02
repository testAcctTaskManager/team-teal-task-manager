import {
  buildCorsHeaders,
  insertInto,
  parseJson,
  queryOne,
  selectAllFrom,
} from "./helpers.js";

// API Endpoints for Comments as a Collection

// Filter Comments by task-id
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.cf_db;
  const CORS = buildCorsHeaders(env, request, "GET,OPTIONS");
  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!db) {
    return new Response(JSON.stringify({ error: "Database not found" }), {
      status: 500,
      headers: CORS,
    });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const url = new URL(request.url);
    const taskId = url.searchParams.get("task_id");

    if (!taskId) {
        return new Response(JSON.stringify({ error: "Missing task_id" }), {
        status: 400,
        headers: CORS,
        });
    }

    const rows = await selectAllFrom(
        db,
        "Comments",
        { whereClause: "task_id = ?", params: [taskId] },
        [],
    );

    return new Response(JSON.stringify(rows || []), { headers: CORS });
    } catch (err) {
    console.error("GET /api/comments error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: CORS || { "Content-Type": "application/json" },
    });
  }
}


// Add a new comment
export async function onRequestPost(context) {
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
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: CORS,
      });
    }

    const body = await parseJson(request);
    const payloadCols = ["task_id", "created_by", "content"].filter(
      (c) => body[c] !== undefined,
    );
    const values = payloadCols.map((c) => body[c]);

    if (payloadCols.length === 0) {
      return new Response(JSON.stringify({ error: "Nothing to create" }), {
        status: 400,
        headers: CORS,
      });
    }

    await insertInto(db, "Comments", payloadCols, values, []);
    const created = await queryOne(
      db,
      "SELECT * FROM Comments WHERE id = last_insert_rowid()",
    );
    return new Response(JSON.stringify(created || {}), {
      status: 201,
      headers: CORS,
    });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: CORS || { "Content-Type": "application/json" },
    });
  }
}
