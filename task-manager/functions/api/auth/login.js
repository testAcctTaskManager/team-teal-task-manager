function base64urlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = base64urlEncode(verifierBytes);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const codeChallenge = base64urlEncode(new Uint8Array(digest));

  return { codeVerifier, codeChallenge };
}

const PAGES_DEV_DOMAIN = "team-teal-task-manager-356.pages.dev";
const TEST_SUBDOMAIN = "test.team-teal-task-manager-356.pages.dev";

function canonicalOrigin(origin, hostname) {
  if (hostname.endsWith(`.${PAGES_DEV_DOMAIN}`) && hostname !== PAGES_DEV_DOMAIN) {
    return `https://${TEST_SUBDOMAIN}`;
  }
  return origin;
}

export async function onRequestGet({ request, env }) {
  const { origin, hostname } = new URL(request.url);
  const redirectUri =
    env.GOOGLE_REDIRECT_URI || `${canonicalOrigin(origin, hostname)}/api/auth/callback`;

  const state = crypto.randomUUID();
  const { codeVerifier, codeChallenge } = await generatePKCE();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const payload = btoa(JSON.stringify({ s: state, o: origin, v: codeVerifier }));
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const secure = isLocal ? "" : " Secure;";
  const domain =
    hostname === PAGES_DEV_DOMAIN || hostname.endsWith(`.${PAGES_DEV_DOMAIN}`)
      ? `; Domain=${PAGES_DEV_DOMAIN}`
      : "";
  const cookie =
    `oauth_state=${payload}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=600${domain}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": cookie,
    },
  });
}
