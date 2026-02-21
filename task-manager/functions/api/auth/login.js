export async function onRequestGet({ request, env }) {
  const origin = env.FRONTEND_ORIGIN || `https://${request.headers.get("host")}`;
  const redirectUri =
    env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return Response.redirect(authUrl, 302);
}
