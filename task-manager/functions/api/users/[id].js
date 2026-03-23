import {
  queryOne,
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
    "role"
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
    "is_active"],
  dbEnvVar: "cf_db",
  orderBy: "id",
});


// GET a row/user
export const onRequestGet = createHandlers.item;

// UPDATE row/user
export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const CORS = buildCorsHeaders(env, request, "GET,PUT,PATCH,DELETE,OPTIONS");
  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse a clone so the original request body remains readable by updateHandlers.item().
  const body = await parseJson(request.clone());

  // Allow only admins to change user roles or activation status.
  if (
    (body.role !== undefined || body.is_active !== undefined) &&
    data?.user?.role !== "admin"
  ) {
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

  if (body.is_active !== undefined) {
    if (
      body.is_active === true ||
      body.is_active === 1 ||
      body.is_active === "1"
    ) {
      body.is_active = 1;
    } else if (
      body.is_active === false ||
      body.is_active === 0 ||
      body.is_active === "0"
    ) {
      body.is_active = 0;
    } else {
      return new Response(JSON.stringify({ error: "Invalid is_active value." }), {
        status: 400,
        headers: CORS || { "Content-Type": "application/json" },
      });
    }
  }

  const pathTargetId = Number(
    new URL(request.url).pathname.split("/").filter(Boolean).at(-1),
  );
  const targetId = Number.isFinite(Number(params?.id))
    ? Number(params?.id)
    : pathTargetId;
  const isSelf = Number.isFinite(targetId) && targetId === Number(data?.user?.id);
  const isAdminUser = data?.user?.role === "admin";
  const deactivatingSelf = body.is_active === 0;
  const demotingSelf = body.role !== undefined && body.role !== "admin";

  if (isAdminUser && isSelf && (deactivatingSelf || demotingSelf)) {
    const db = env.cf_db;
    const adminCountRow = await queryOne(
      db,
      "SELECT COUNT(*) AS count FROM Users WHERE role = 'admin' AND is_active = 1",
    );
    const activeAdminCount = Number(adminCountRow?.count || 0);

    if (activeAdminCount <= 1) {
      return new Response(
        JSON.stringify({
          error: "Cannot remove the only active admin account.",
        }),
        {
          status: 400,
          headers: CORS || { "Content-Type": "application/json" },
        },
      );
    }
  }

  const normalizedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(body),
  });
  return updateHandlers.item({ ...context, request: normalizedRequest });
}

// DELETE a row/user
export const onRequestDelete = createHandlers.item;

// Get API options
export const onRequestOptions = createHandlers.item;
