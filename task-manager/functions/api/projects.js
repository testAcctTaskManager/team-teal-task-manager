import { makeCrudHandlers } from "./helpers.js";

// Generic CRUD handlers 
const projectHandlers = makeCrudHandlers({
    table: "projects",
    primaryKey: "id",
    allowedColumns: ["name", "created_by", "status", "created_at", "updated_at"],
    dbEnvVar: "cf_db",
    orderBy: "id ASC",
});

// Routes
export const onRequestGet = projectHandlers.collection;
export const onRequestPost = projectHandlers.collection;
export const onRequestOptions = projectHandlers.collection;