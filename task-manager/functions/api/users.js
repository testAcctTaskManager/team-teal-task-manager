import {
	buildCorsHeaders,
	execute,
	makeCrudHandlers,
	parseJson,
	queryOne,
} from "./helpers.js";
import { isValidUserRole } from "./constants/roles.js";

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
export async function onRequestPost(context) {
	const { request, env, data } = context;
	const CORS = buildCorsHeaders(env, request, "GET,POST,OPTIONS");
	if (request.headers.get("Origin") && !CORS) {
		return new Response(JSON.stringify({ error: "Origin not allowed" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (data?.user?.role !== "admin") {
		return new Response(JSON.stringify({ error: "Forbidden" }), {
			status: 403,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}

	const body = await parseJson(request);
	const normalizedEmail = String(body.email || "")
		.trim()
		.toLowerCase();

	if (!normalizedEmail) {
		return new Response(JSON.stringify({ error: "Email is required." }), {
			status: 400,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}

	const displayName = String(body.display_name || "").trim();
	if (!displayName) {
		return new Response(JSON.stringify({ error: "Display name is required." }), {
			status: 400,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}

	const role = body.role || "developer";
	if (!isValidUserRole(role)) {
		return new Response(JSON.stringify({ error: "Unknown role." }), {
			status: 400,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}

	let isActive = 1;
	if (body.is_active !== undefined) {
		if (
			body.is_active === true ||
			body.is_active === 1 ||
			body.is_active === "1"
		) {
			isActive = 1;
		} else if (
			body.is_active === false ||
			body.is_active === 0 ||
			body.is_active === "0"
		) {
			isActive = 0;
		} else {
			return new Response(JSON.stringify({ error: "Invalid is_active value." }), {
				status: 400,
				headers: CORS || { "Content-Type": "application/json" },
			});
		}
	}

	const db = env.cf_db;
	const existing = await queryOne(
		db,
		"SELECT id FROM Users WHERE lower(email) = lower(?)",
		[normalizedEmail],
	);
	if (existing) {
		return new Response(JSON.stringify({ error: "User email already exists." }), {
			status: 409,
			headers: CORS || { "Content-Type": "application/json" },
		});
	}

	await execute(
		db,
		"INSERT INTO Users (display_name, email, timezone, role, is_active) VALUES (?, ?, ?, ?, ?)",
		[displayName, normalizedEmail, body.timezone ?? null, role, isActive],
	);

	const created = await queryOne(
		db,
		"SELECT * FROM Users WHERE id = last_insert_rowid()",
	);

	return new Response(JSON.stringify(created || {}), {
		status: 201,
		headers: CORS || { "Content-Type": "application/json" },
	});
}
export const onRequestOptions = handlers.collection;