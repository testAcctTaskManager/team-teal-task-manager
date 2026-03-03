import { makeCrudHandlers } from "./helpers.js";

const columnHandlers = makeCrudHandlers({
  table: "User_Providers",
  primaryKey: "id",
  allowedColumns: ["user_id", "provider", "provider_user_id", "token_expires_at", "created_at", "updated_at"],
  selectColumns: ["id", "user_id", "provider", "provider_user_id", "token_expires_at", "created_at", "updated_at"],
  dbEnvVar: "cf_db",
  orderBy: "user_id",
});

export const onRequestGet = columnHandlers.collection;
export const onRequestPost = columnHandlers.collection;
export const onRequestOptions = columnHandlers.collection;
