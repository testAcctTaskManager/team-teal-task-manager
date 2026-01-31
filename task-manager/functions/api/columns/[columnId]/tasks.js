import { queryAll, buildCorsHeaders } from "../../helpers";

export async function onRequestGet(context) {

    const { request, env, params } = context;

    const CORS = buildCorsHeaders(env, request, "GET,OPTIONS");

    //borrowed from helpers.js
    if (request.headers.get("Origin") && !CORS) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    //cf_db D1 binding name
    const db = env.cf_db;

    //borrowed from helpers.js
    if (!db) {
        return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: CORS,
        })
    };

    //borrowed from helpers.js
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
    };

    //GET tasks from column_tasks table:
    const sql = 
    `
    SELECT *
    FROM Column_Tasks
    WHERE column_id = ?
    ORDER BY position
    `
    ;

    //Using queryAll helper to get a array of rows from column_tasks
    //These should be the tasks from that row. 
    const rows = await queryAll(db, sql, [params.columnId]);

    return new Response(
        JSON.stringify(rows),
        { status: 200, headers: CORS },
    );
};


