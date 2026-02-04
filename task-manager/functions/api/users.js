import {
	makeCrudHandlers,
	parseJson,
	insertInto,
	queryOne,
	buildCorsHeaders,
} from "./helpers.js";

const config = {
	table: "Users",
	primaryKey: "id",
	// For now we only accept these fields from clients; timestamps
	// are managed by the database defaults.
	allowedColumns: ["display_name", "email", "timezone"],
	dbEnvVar: "cf_db",
	orderBy: "id",
};

const handlers = makeCrudHandlers(config);

export const onRequestGet = handlers.collection;
export const onRequestOptions = handlers.collection;

export async function onRequestPost(context) {
	const { request, env } = context;

	// Delegate non-POSTs to the default collection handler
	if (request.method !== "POST") return handlers.collection(context);

	const db = env[config.dbEnvVar];
	const CORS = buildCorsHeaders(env, request, "GET,POST,OPTIONS");
	if (request.headers.get("Origin") && !CORS) {
		return new Response(JSON.stringify({ error: "Origin not allowed" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		if (!db)
			return new Response(JSON.stringify({ error: "Database not found" }), {
				status: 500,
				headers: CORS,
			});

		const body = await parseJson(request);

		// Only accept explicitly allowed columns from the request body
		const payloadCols = config.allowedColumns.filter(
			(c) => body[c] !== undefined,
		);
		if (payloadCols.length === 0) {
			return new Response(JSON.stringify({ error: "Nothing to create" }), {
				status: 400,
				headers: CORS,
			});
		}

		await insertInto(
			db,
			config.table,
			payloadCols,
			payloadCols.map((c) => body[c]),
		);
		const created = await queryOne(
			db,
			`SELECT * FROM ${config.table} WHERE ${config.primaryKey} = last_insert_rowid()`,
		);
		return new Response(JSON.stringify(created || {}), {
			status: 201,
			headers: CORS,
		});
	} catch (err) {
		const rawMessage = err && err.message ? err.message : err || "Internal error";
		const message = String(rawMessage);

		// Map UNIQUE(email) constraint violations to a 400 with a clear message
		if (
			message.includes("UNIQUE constraint failed") &&
			(message.includes("Users.email") || message.includes("users.email"))
		) {
			return new Response(JSON.stringify({ error: "Email already in use" }), {
				status: 400,
				headers: CORS || { "Content-Type": "application/json" },
			});
		}

		// Only log unexpected errors
		console.error(
			`/api/${config.table} collection POST error:`,
			(err && err.stack ? err.stack : err),
		);

		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}
}

