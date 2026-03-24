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
  const { request, env, data } = context;
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
    const callerId = Number(data?.user?.id);
    if (!Number.isFinite(callerId)) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: CORS,
      });
    }

    if (body.task_id === undefined || body.content === undefined) {
      return new Response(JSON.stringify({ error: "Missing task_id or content" }), {
        status: 400,
        headers: CORS,
      });
    }

    const payloadCols = ["task_id", "created_by", "content"];
    const values = [body.task_id, callerId, body.content];

    await insertInto(db, "Comments", payloadCols, values, []);
    const created = await queryOne(
      db,
      "SELECT * FROM Comments ORDER BY id DESC LIMIT 1",
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
