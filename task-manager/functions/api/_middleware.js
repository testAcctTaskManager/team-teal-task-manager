import { jwtVerify } from "jose";
import { parseCookies, queryOne } from "./helpers.js";
import { isValidUserRole } from "./constants/roles.js";
import {
  AUTHZ_DECISIONS,
  getAuthorizationDecision,
} from "./constants/authorizationMatrix.js";

const PUBLIC_PREFIX = "/api/auth/";
// take property DENY from AUTHZ_DECISIONS and create const DENY with that value
const { DENY } = AUTHZ_DECISIONS; 

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return next();
  }

  if (url.pathname.startsWith(PUBLIC_PREFIX)) {
    return next();
  }

  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies.session;

  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const userId = Number(payload.sub);
    if (Number.isNaN(userId)) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof payload.email !== "string") {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    // Look for database
    const db = env.cf_db;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query DB for userID and find their role  
    const user = await queryOne(db, "SELECT id, email, role FROM Users WHERE id = ?", [
      userId,
    ]);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check that the user role is valid
    if (!isValidUserRole(user.role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    context.data = context.data || {};

    // Add role to context along with id and email
    context.data.user = { id: user.id, email: user.email, role: user.role };

    // Check if this combination of route + method + role is authorized
    const decision = getAuthorizationDecision({
      pathname: url.pathname,
      method: request.method,
      role: user.role,
    });

    if (decision === DENY) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
}
