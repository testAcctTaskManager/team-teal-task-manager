import { SignJWT } from "jose";
import { queryOne, execute } from "../helpers.js";

const PAGES_DEV_SUFFIX = ".team-teal-task-manager.pages.dev";
const COOKIE_DOMAIN = "team-teal-task-manager.pages.dev";

function isAllowedOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === COOKIE_DOMAIN ||
      hostname.endsWith(PAGES_DEV_SUFFIX) ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function isLocalhost(hostname) {
  const h = hostname.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

function buildSessionCookie(token, hostname) {
  const secure = isLocalhost(hostname) ? "" : " Secure;";
  let cookie = `session=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=604800`;
  if (hostname === COOKIE_DOMAIN || hostname.endsWith(PAGES_DEV_SUFFIX)) {
    cookie += `; Domain=${COOKIE_DOMAIN}`;
  }
  return cookie;
}

function clearOAuthStateCookie(hostname) {
  const secure = isLocalhost(hostname) ? "" : " Secure;";
  return `oauth_state=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}

function getOAuthState(request) {
  const header = request.headers.get("Cookie") || "";
  for (const pair of header.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === "oauth_state") {
      try {
        return JSON.parse(atob(rest.join("=")));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function redirectWithClear(url, hostname) {
  const headers = new Headers({ Location: url });
  headers.append("Set-Cookie", clearOAuthStateCookie(hostname));
  return new Response(null, { status: 302, headers });
}

async function redirectWithSession(url, userId, email, jwtSecret, hostname) {
  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const headers = new Headers({ Location: url });
  headers.append("Set-Cookie", buildSessionCookie(token, hostname));
  headers.append("Set-Cookie", clearOAuthStateCookie(hostname));
  return new Response(null, { status: 302, headers });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const fallbackOrigin = url.origin;

  const oauthState = getOAuthState(request);
  const returnedState = url.searchParams.get("state");

  if (!oauthState || returnedState !== oauthState.s) {
    return new Response("state mismatch – possible CSRF", { status: 403 });
  }

  let origin =
    oauthState.o && isAllowedOrigin(oauthState.o)
      ? oauthState.o
      : fallbackOrigin;

  if (isLocalhost(url.hostname)) {
    origin = fallbackOrigin;
  }

  const codeVerifier = oauthState.v;

  if (error) {
    console.error("oauth error:", error);
    return redirectWithClear(origin, url.hostname);
  }

  if (!code) {
    return new Response("missing code", { status: 400 });
  }

  if (!env.JWT_SECRET) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const callbackOrigin =
    url.hostname.endsWith(PAGES_DEV_SUFFIX) && url.hostname !== COOKIE_DOMAIN
      ? `https://${COOKIE_DOMAIN}`
      : origin;
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${callbackOrigin}/api/auth/callback`;
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
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
      console.error("token exchange failed", tokenData);
      return redirectWithClear(origin, url.hostname);
    }

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfoData = await userInfoRes.json().catch(() => null);
    if (!userInfoRes.ok) {
      console.error("could not fetch user info", userInfoData);
      return redirectWithClear(origin, url.hostname);
    }

    let userId = null;

    const existingUser = await queryOne(
      db,
      "SELECT id FROM Users WHERE email = ?",
      [userInfoData.email]
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      await execute(
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
        return redirectWithClear(`${origin}/auth/error?reason=create_user_failed`, url.hostname);
      }
      userId = newUser.id;
    }

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
        return redirectWithClear(`${origin}/auth/error?reason=provider_conflict`, url.hostname);
      }
    } else {
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;
      await execute(
        db,
        "INSERT INTO User_Providers (user_id, provider, provider_user_id, token_expires_at) VALUES (?, ?, ?, ?)",
        [userId, "google", userInfoData.sub ?? null, expiresAt]
      );
    }

    return await redirectWithSession(origin, userId, userInfoData.email, env.JWT_SECRET, url.hostname);
  } catch (err) {
    console.error("callback onRequest error", err);
    return redirectWithClear(origin, url.hostname);
  }
}
