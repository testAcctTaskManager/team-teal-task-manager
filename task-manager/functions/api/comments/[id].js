import { makeCrudHandlers } from "../helpers.js";

// Use the generic CRUD handlers for the Comments endpoint

// Columns we are allowing GET/POST/DELETE/OPTIONS
const createHandlers = makeCrudHandlers({
  table: "Comments",
  primaryKey: "id",
  allowedColumns: ["task_id", "created_by", "content"],
  dbEnvVar: "cf_db",
  orderBy: "id",
});

// Columns we are allowing UPDATE
const updateHandlers = makeCrudHandlers({
  table: "Comments",
  primaryKey: "id",
  allowedColumns: ["content"],
  dbEnvVar: "cf_db",
  orderBy: "id",
});

// GET a row/comment
export const onRequestGet = createHandlers.item; 

// UPDATE row/comment (content only)
export const onRequestPatch = updateHandlers.item; 

// DELETE a row/comment
export const onRequestDelete = createHandlers.item;

// Get API options
export const onRequestOptions = createHandlers.item; 
