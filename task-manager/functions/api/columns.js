import { makeCrudHandlers } from "./helpers.js";

 // Use the generic CRUD handlers for the column collection endpoint
const columnHandlers = makeCrudHandlers({
  table: "Columns",
  primaryKey: "id",
  allowedColumns: ["project_id", "name", "key", "position"],
  dbEnvVar: "cf_db",
  orderBy: "position  ASC",
});

export const onRequestGet = columnHandlers.collection;
export const onRequestPost   = columnHandlers.collection;
export const onRequestOptions = columnHandlers.collection;
