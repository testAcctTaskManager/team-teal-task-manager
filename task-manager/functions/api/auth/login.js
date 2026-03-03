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

export async function onRequestGet({ request, env }) {
  const { origin, hostname } = new URL(request.url);
  const redirectUri =
    env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/callback`;

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
  const cookie =
    `oauth_state=${payload}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=600`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": cookie,
    },
  });
}
