import { makeCrudHandlers, selectOneFrom, updateTable } from "../helpers.js";

// Generic CRUD handlers
const sprintHandlers = makeCrudHandlers({
  table: "sprints",
  primaryKey: "id",
  allowedColumns: [
    "id",
    "project_id",
    "name",
    "start_date",
    "end_date",
    "created_by",
    "created_at",
    "updated_at",
    "status"
  ],
  dbEnvVar: "cf_db",
  orderBy: "id ASC",
});

/* Custom update handler. CloudFlare D1 does not automatically update the timestamp when ON UPDATE is used. The purpose of this method is to update the sprint and included the updated timestamp as well */

const updateSprintTimestamps = async (context) => {
  const { env, params, request } = context;
  const db = env.cf_db;
  const id = params.id;

  // Checking validity
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid Sprint ID" }), {
      status: 400,
      headers: { "Content-Type:": "application/json" },
    });
  }

  try {
    // Parse JSON
    const incomingData = await request.json();

    // Prepare update object
    const allowed = [
      "project_id",
      "name",
      "created_by",
      "start_date",
      "end_date",
      "status"
    ];
    const updatesObj = {};

    for (const key of allowed) {
      if (incomingData[key] !== undefined) {
        updatesObj[key] = incomingData[key];
      }
    }

    // Force the timestamp update because cloudflare D1 doesn't do this automatically
    updatesObj.updated_at = new Date().toISOString();

    // Update using the helper updateTable() from helpers.js
    await updateTable(db, "sprints", updatesObj, "id = ?", [id], ["sprints"]);

    // Fetch refreshed version
    const updatedRow = await selectOneFrom(db, "sprints", {
      whereClause: "id = ?",
      params: [id],
    });

    if (!updatedRow) {
      return new Response(
        JSON.stringify({ error: "sprint not found after update" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(updatedRow), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PATCH Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Routes for item level operations
export const onRequestGet = sprintHandlers.item;
export const onRequestDelete = sprintHandlers.item;
export const onRequestOptions = sprintHandlers.item;

// Patch & Put using the custom timestamp method
export const onRequestPatch = updateSprintTimestamps;
export const onRequestPut = updateSprintTimestamps;
