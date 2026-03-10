import { jwtVerify } from "jose";
import { parseCookies } from "./helpers.js";

const PUBLIC_PREFIX = "/api/auth/";

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

    context.data = context.data || {};
    context.data.user = { id: userId, email: payload.email };
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
