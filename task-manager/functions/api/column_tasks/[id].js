import { makeCrudHandlers } from "../helpers.js";

const handlers = makeCrudHandlers({
  table: "Column_Tasks",
  primaryKey: "id",
  allowedColumns: ["task_id", "column_id", "position"],
  dbEnvVar: "cf_db",
  orderBy: "position ASC",
});

export const onRequestGet = handlers.item;
export const onRequestPut = handlers.item;
export const onRequestPatch = handlers.item;
export const onRequestDelete = handlers.item;
export const onRequestOptions = handlers.item;
