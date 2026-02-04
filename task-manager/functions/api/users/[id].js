import { makeCrudHandlers } from "../helpers.js";

// Use the generic CRUD handlers for the Customers item endpoint
const createHandlers = makeCrudHandlers({
  table: "Users",
  primaryKey: "id",
  // these should maybe change -- a lot of these should be checked application-level
  allowedColumns: [
    "display_name",
    "email",
    "timezone",
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
    "updated_at"],
  dbEnvVar: "cf_db",
  orderBy: "id",
});


// GET a row/user
export const onRequestGet = createHandlers.item;

// UPDATE row/user
export const onRequestPatch = updateHandlers.item;

// DELETE a row/user
export const onRequestDelete = createHandlers.item;

// Get API options
export const onRequestOptions = createHandlers.item;
