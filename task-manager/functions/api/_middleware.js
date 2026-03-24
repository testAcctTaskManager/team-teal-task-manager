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
    const response = await next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Cache-Control", "private, no-store");
    return newResponse;
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

    // Query DB by email to handle dev/prod database differences.
    // Since auth redirects through the main domain, JWT user IDs may not match
    // the current branch's database. Email is the stable identifier.
    const user = await queryOne(
      db,
      "SELECT id, email, role, is_active FROM Users WHERE lower(email) = lower(?)",
      [payload.email],
    );
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (Number(user.is_active) !== 1) {
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

    // Context-dependent decisions

    // Enforce self-only access on /api/users/:id routes.
    if (decision === AUTHZ_DECISIONS.SELF) {
      if (url.pathname.startsWith("/api/users/")) {
        const idStr = url.pathname.split("/").filter(Boolean).at(-1);
        const targetId = Number(idStr);
        if (!Number.isFinite(targetId) || targetId !== context.data.user.id) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // Logged-in user can only edit their own comments
    if (decision === AUTHZ_DECISIONS.OWN_COMMENT) {
      const idStr = url.pathname.split("/").filter(Boolean).at(-1);
      const commentId = Number(idStr);
      if (!Number.isFinite(commentId)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Query for the comment we are attempting to route to
      const comment = await queryOne(
        db,
        "SELECT created_by FROM Comments WHERE id = ?",
        [commentId],
      );

      // Reject if we find a comment and logged in user did not create it.
      // Let comment endpoints retain normal 404 behavior for missing records.
      if (comment && Number(comment.created_by) !== context.data.user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fail for unknown decision types.
    const knownDecisions = new Set([
      AUTHZ_DECISIONS.ALLOW,
      AUTHZ_DECISIONS.DENY,
      AUTHZ_DECISIONS.SELF,
      AUTHZ_DECISIONS.OWN_COMMENT,
    ]);
    if (!knownDecisions.has(decision)) {
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

  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("Cache-Control", "private, no-store");
  return newResponse;
}
