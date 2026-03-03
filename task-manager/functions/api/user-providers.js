import { buildCorsHeaders, queryAll } from "./helpers.js";

const SELECT_COLUMNS =
  "id, user_id, provider, provider_user_id, token_expires_at, created_at, updated_at";

export async function onRequestGet({ request, env, data }) {
  const CORS = buildCorsHeaders(env, request);
  if (request.headers.get("Origin") && !CORS) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = data?.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: CORS,
    });
  }

  const rows = await queryAll(
    env.cf_db,
    `SELECT ${SELECT_COLUMNS} FROM User_Providers WHERE user_id = ? ORDER BY created_at`,
    [userId],
  );
  return new Response(JSON.stringify(rows), { headers: CORS });
}

export async function onRequestOptions({ request, env }) {
  const CORS = buildCorsHeaders(env, request, "GET,OPTIONS");
  return new Response(null, { status: 204, headers: CORS });
}
