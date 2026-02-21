import { SignJWT } from "jose";
import { queryOne, queryAll, execute } from "../helpers.js";

function buildSessionCookie(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

async function redirectWithSession(url, userId, email, jwtSecret) {
  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": buildSessionCookie(token),
    },
  });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const debug = url.searchParams.get("debug") === "1";

  const origin = env.FRONTEND_ORIGIN || `https://${request.headers.get("host")}`;

  if (error) {
    console.error("oauth error:", error);
    if (debug) return new Response(JSON.stringify({ error }), { status: 400, headers: { "Content-Type": "application/json" } });
    return Response.redirect(origin, 302);
  }

  if (!code) {
    return new Response("missing code", { status: 400 });
  }

  const redirectUri = env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/callback`;
  const db = env.cf_db;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
      console.error("token exchange failed", tokenData);
      if (debug) return new Response(JSON.stringify({ tokenError: tokenData }), { status: 502, headers: { "Content-Type": "application/json" } });
      return Response.redirect(origin, 302);
    }

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfoData = await userInfoRes.json().catch(() => null);
    if (!userInfoRes.ok) {
      console.error("could not fetch user info", userInfoData);
      if (debug) return new Response(JSON.stringify({ userInfoError: userInfoData }), { status: 502, headers: { "Content-Type": "application/json" } });
      return Response.redirect(origin, 302);
    }

    // Resolve or create the user directly via DB
    let userId = null;

    const existingUser = await queryOne(
      db,
      "SELECT id FROM Users WHERE email = ?",
      [userInfoData.email]
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const insertResult = await execute(
        db,
        "INSERT INTO Users (display_name, email) VALUES (?, ?)",
        [userInfoData.name, userInfoData.email]
      );
      const newUser = await queryOne(
        db,
        "SELECT id FROM Users WHERE id = last_insert_rowid()"
      );
      if (!newUser) {
        console.error("failed to create user");
        if (debug) return new Response(JSON.stringify({ error: "failed to create user" }), { status: 500, headers: { "Content-Type": "application/json" } });
        return Response.redirect(`${origin}/auth/error?reason=create_user_failed`, 302);
      }
      userId = newUser.id;
    }

    // Ensure a provider mapping exists
    const existingProvider = await queryOne(
      db,
      "SELECT id, user_id FROM User_Providers WHERE provider = ? AND provider_user_id = ?",
      ["google", userInfoData.sub]
    );

    if (existingProvider) {
      if (existingProvider.user_id !== userId) {
        console.error("provider linked to another account", {
          providerUserId: userInfoData.sub,
          linkedTo: existingProvider.user_id,
          email: userInfoData.email,
        });
        if (debug) return new Response(JSON.stringify({ error: "provider-linked-to-different-account" }), { status: 409, headers: { "Content-Type": "application/json" } });
        return Response.redirect(`${origin}/auth/error?reason=provider_conflict`, 302);
      }
    } else {
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;
      await execute(
        db,
        "INSERT INTO User_Providers (user_id, provider, provider_user_id, refresh_token, token_expires_at) VALUES (?, ?, ?, ?, ?)",
        [userId, "google", userInfoData.sub ?? null, tokenData.refresh_token ?? null, expiresAt]
      );
    }

    return await redirectWithSession(origin, userId, userInfoData.email, env.JWT_SECRET);
  } catch (err) {
    console.error("callback onRequest error", err);
    if (debug) return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    return Response.redirect(origin, 302);
  }
}
