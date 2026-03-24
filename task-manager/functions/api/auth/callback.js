import { SignJWT } from "jose";
import { execute, queryOne } from "../helpers.js";

const PAGES_DEV_SUFFIX = ".team-teal-task-manager-356.pages.dev";
const COOKIE_DOMAIN = "team-teal-task-manager-356.pages.dev";
const TEST_SUBDOMAIN = "test.team-teal-task-manager-356.pages.dev";

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

function loginErrorUrl(origin) {
  return `${origin}/login?auth_error=login_failed`;
}

function isAuthDebugEnabled(env) {
  return env.AUTH_DEBUG === "true";
}

function debugLog(env) {
  if (!isAuthDebugEnabled(env)) return;
  console.warn("[auth-debug] login attempt failed");
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
    debugLog(env);
    return redirectWithClear(loginErrorUrl(fallbackOrigin), url.hostname);
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
    debugLog(env);
    return redirectWithClear(loginErrorUrl(origin), url.hostname);
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
      ? `https://${TEST_SUBDOMAIN}`
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
      debugLog(env);
      return redirectWithClear(loginErrorUrl(origin), url.hostname);
    }

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfoData = await userInfoRes.json().catch(() => null);
    if (!userInfoRes.ok) {
      debugLog(env);
      return redirectWithClear(loginErrorUrl(origin), url.hostname);
    }

    const normalizedEmail = String(userInfoData.email || "")
      .trim()
      .toLowerCase();
    const isEmailVerified =
      userInfoData.email_verified === true ||
      userInfoData.email_verified === "true" ||
      userInfoData.verified_email === true ||
      userInfoData.verified_email === "true";

    if (!normalizedEmail || !isEmailVerified) {
      debugLog(env);
      return redirectWithClear(loginErrorUrl(origin), url.hostname);
    }

    const existingUser = await queryOne(
      db,
      "SELECT id, is_active FROM Users WHERE lower(email) = lower(?)",
      [normalizedEmail],
    );

    if (!existingUser || Number(existingUser.is_active) !== 1) {
      debugLog(env);
      return redirectWithClear(loginErrorUrl(origin), url.hostname);
    }

    const userId = existingUser.id;

    const existingProvider = await queryOne(
      db,
      "SELECT id, user_id FROM User_Providers WHERE provider = ? AND provider_user_id = ?",
      ["google", userInfoData.sub]
    );

    if (existingProvider) {
      if (existingProvider.user_id !== userId) {
        debugLog(env);
        return redirectWithClear(loginErrorUrl(origin), url.hostname);
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

    return await redirectWithSession(
      origin,
      userId,
      normalizedEmail,
      env.JWT_SECRET,
      url.hostname,
    );
  } catch {
    debugLog(env);
    return redirectWithClear(loginErrorUrl(origin), url.hostname);
  }
}
