import {
  makeCrudHandlers,
  parseJson,
  buildCorsHeaders,
} from "../helpers.js";
import { isValidUserRole } from "../constants/roles.js";

// Use the generic CRUD handlers for the Users item endpoint
const createHandlers = makeCrudHandlers({
  table: "Users",
  primaryKey: "id",
  // these should maybe change -- a lot of these should be checked application-level
  allowedColumns: [
    "display_name",
    "email",
    "timezone",
    "role",
    "created_at",
    "updated_at"
  ],
  dbEnvVar: "cf_db",
  orderBy: "id",
});

// Columns we are allowing UPDATE
const updateHandlers = makeCrudHandlers({
  table: "Users",
  primaryKey: "id",
  allowedColumns: [
    "display_name",
    "timezone",
    "role",
    "updated_at"],
  dbEnvVar: "cf_db",
  orderBy: "id",
});


// GET a row/user
export const onRequestGet = createHandlers.item;

// UPDATE row/user
export async function onRequestPatch(context) {
  const { request, env, data } = context;
  const CORS = buildCorsHeaders(env, request, "GET,PUT,PATCH,DELETE,OPTIONS");
  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse a clone so the original request body remains readable by updateHandlers.item().
  const body = await parseJson(request.clone());

  // Allow only admins to change user roles
  if (body.role !== undefined && data?.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: CORS || { "Content-Type": "application/json" },
    });
  }
  
  if (body.role !== undefined && !isValidUserRole(body.role)) {
    return new Response(JSON.stringify({ error: "Unknown role." }), {
      status: 400,
      headers: CORS || { "Content-Type": "application/json" },
    });
  }

  return updateHandlers.item(context);
}

// DELETE a row/user
export const onRequestDelete = createHandlers.item;

// Get API options
export const onRequestOptions = createHandlers.item;
