import { makeCrudHandlers } from "./helpers.js";

const handlers = makeCrudHandlers({
  table: "Tasks",
  primaryKey: "id",
  // these should maybe change -- a lot of these should be checked application-level
  allowedColumns: [
    "project_id",
    "column_id",
    "sprint_id",
    "reporter_id",
    "assignee_id",
    "created_by",
    "modified_by",
    "title",
    "description",
    "start_date",
    "end_date",
    "updated_at",
    "position",
  ],
  dbEnvVar: "cf_db",
  orderBy: "id",
});

export const onRequestGet = handlers.collection;
export const onRequestPost = handlers.collection;
export const onRequestOptions = handlers.collection;
