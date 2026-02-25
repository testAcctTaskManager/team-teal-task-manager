import { makeCrudHandlers } from "./helpers.js";

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
  ],
  dbEnvVar: "cf_db",
  orderBy: "id ASC",
});

// Routes
export const onRequestGet = sprintHandlers.collection;
export const onRequestPost = sprintHandlers.collection;
export const onRequestOptions = sprintHandlers.collection;
