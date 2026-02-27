import { makeCrudHandlers, selectOneFrom, updateTable } from "../helpers.js";

// Generic CRUD handlers 
const projectHandlers = makeCrudHandlers({
  table: "projects",
  primaryKey: "id",
  allowedColumns: ["name", "created_by", "status", "type", "created_at", "updated_at"],
  dbEnvVar: "cf_db",
  orderBy: "id ASC",
});

/* Custom update handler. CloudFlare D1 does not automatically update the timestamp when ON UPDATE is used. The purpose of this method is to update the project and included the updated timestamp as well */

const updateProjectTimestamps = async (context) => {

  const { env, params, request } = context;
  const db = env.cf_db;
  const id = params.id;

  // Checking validity
  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid Project ID"}), { 
        status: 400,
        headers: { "Content-Type:": "application/json" },
    });
  }
 
  try {
    // Parse JSON
     const incomingData = await request.json();

    // Prepare update object
    const allowed = ["name", "created_by", "status", "type"];
    const updatesObj = {};

    for (const key of allowed) {
        if (incomingData[key] !== undefined) {
            updatesObj[key] = incomingData[key];
        }
    }

    // Force the timestamp update because cloudflare D1 doesn't do this automatically 
    updatesObj.updated_at = new Date().toISOString();

    // Update using the helper updateTable() from helpers.js
    await updateTable(
        db,
        "projects",
        updatesObj,
        "id = ?",
        [id],
        ["projects"]
    );

    // Fetch refreshed version
    const updatedRow = await selectOneFrom(
        db,
        "projects",
        { whereClause: "id = ?", params: [id] }
    );

    if (!updatedRow) {
        return new Response(JSON.stringify({ error: "Project not found after update" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(updatedRow), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

} catch(err) {
    console.error("PATCH Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
    });
};

};

// Routes for item level operations
export const onRequestGet = projectHandlers.item;
export const onRequestDelete = projectHandlers.item;
export const onRequestOptions = projectHandlers.item;

// Patch & Put using the custom timestamp method
export const onRequestPatch = updateProjectTimestamps;
export const onRequestPut = updateProjectTimestamps;
