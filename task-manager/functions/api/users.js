import {
	makeCrudHandlers
} from "./helpers.js";

const config = {
	table: "Users",
	primaryKey: "id",
	// For now we only accept these fields from clients; timestamps
	// are managed by the database defaults.
	allowedColumns: ["display_name", "email", "timezone", "role"],
	dbEnvVar: "cf_db",
	orderBy: "id",
};

const handlers = makeCrudHandlers(config);

export const onRequestGet = handlers.collection;
export const onRequestOptions = handlers.collection;