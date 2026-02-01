import { queryAll, queryOne, buildCorsHeaders, parseJson, insertInto } from "../../helpers";

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


//End GET start POST


export async function onRequestPost(context) {
    
    const { request, env, params } = context;

    const CORS = buildCorsHeaders(env, request, "POST,OPTIONS");

    //borrowed from helpers.js
    if (request.headers.get("Origin") && !CORS) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    //borrowed from helpers.js
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
    };

    const body = await parseJson(request);

    //cf_db D1 binding name
    const db = env.cf_db;

    //borrowed from helpers.js
    if (!db) {
        return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: CORS,
        })
    };

    //Geting the task with the lowest position first LIFO
    const sql = 
    `
    SELECT MAX(position) AS max_position
    FROM Column_Tasks
    WHERE column_id = ?
    `
    ;

    const result = await queryOne(db, sql, [params.columnId]);

    // Method for inserting tasks with their position, taking into account the first entry
    // and then correct placement for subsequint entries. 
    // (AI Transparency: used AI to assist in writing this concisely)
    const calcNextPosition = 
        result?.max_position === null || result?.max_position === undefined
        ? 1
        : result.max_position = 1;

    await insertInto (
        db, 
        "Column_Tasks",
        ["task_id", "column_id", "position"],
        [body.task_id, params.columnId, calcNextPosition]
    );

    return new Response(
        JSON.stringify({
            task_id: body.task_id,
            columnId: params.columnId,
            position: calcNextPosition,
        }), 
        { status: 201, headers: CORS}
    );
};

