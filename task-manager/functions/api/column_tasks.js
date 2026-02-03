import { makeCrudHandlers } from "./helpers.js";

const handlers = makeCrudHandlers({
  table: "Column_Tasks",
  primaryKey: "id",
  allowedColumns: ["task_id", "column_id", "position"],
  dbEnvVar: "cf_db",
  orderBy: "position ASC",
});

export const onRequestGet = handlers.collection;
export const onRequestPost = handlers.collection;
export const onRequestOptions = handlers.collection;
