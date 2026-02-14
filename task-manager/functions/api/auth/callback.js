export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const debug = url.searchParams.get("debug") === "1";

  // determine origin for internal API calls and redirect URI
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

  try {
    // exchange code for tokens
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

    // fetch user info
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfoData = await userInfoRes.json().catch(() => null);
    if (!userInfoRes.ok) {
      console.error("could not fetch user info", userInfoData);
      if (debug) return new Response(JSON.stringify({ userInfoError: userInfoData }), { status: 502, headers: { "Content-Type": "application/json" } });
      return Response.redirect(origin, 302);
    }

    // attempt to create or resolve user
    let userId = null;
    let addUserRes = await fetch(new URL("/api/users", origin).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: userInfoData.name, email: userInfoData.email }),
    });
    let addUserBody = await addUserRes.json().catch(() => null);

    if (addUserRes.ok && addUserBody && addUserBody.id) {
      userId = addUserBody.id;
    } else {
      // if creation fails, link provider to existing user
      const errMsg = addUserBody && addUserBody.error ? String(addUserBody.error) : "";
      if (errMsg.includes("Email already in use")) {
        // look up existing user by email
        const usersRes = await fetch(new URL(`/api/users?email=${encodeURIComponent(userInfoData.email)}`, origin).toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const usersList = await usersRes.json().catch(() => []);
        const existingUser = Array.isArray(usersList) && usersList.length ? usersList[0] : null;
        if (!existingUser) {
          console.error("email conflict but no user found", { email: userInfoData.email, addUserBody });
          if (debug) return new Response(JSON.stringify({ error: "email conflict but lookup failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
          return Response.redirect("/auth/error?reason=email_conflict_lookup_failed", 302);
        }
        userId = existingUser.id;

        // check if provider mapping already exists for this provider_user_id
        const provCheckRes = await fetch(new URL(`/api/auth/user-providers?provider=google&provider_user_id=${encodeURIComponent(userInfoData.sub)}`, origin).toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const provList = await provCheckRes.json().catch(() => []);
        const existingProv = Array.isArray(provList) && provList.length ? provList[0] : null;

        if (existingProv) {
          if (existingProv.user_id !== userId) {
            console.error("provider linked to another account", { providerUserId: userInfoData.sub, linkedTo: existingProv.user_id, email: userInfoData.email });
            if (debug) return new Response(JSON.stringify({ error: "provider-linked-to-different-account" }), { status: 409, headers: { "Content-Type": "application/json" } });
            return Response.redirect("/auth/error?reason=provider_conflict", 302);
          }
        } else {
          // create provider record linking this provider_user_id to the existing user
          const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;
          const createProvRes = await fetch(new URL("/api/auth/user-providers", origin).toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, provider_user_id: userInfoData.sub ?? null, provider: "google", refresh_token: tokenData.refresh_token, token_expires_at: expiresAt }),
          });
          const createdProv = await createProvRes.json().catch(() => null);
          if (!createProvRes.ok) {
            console.error("failed creating provider after email exists", createdProv);
            if (debug) return new Response(JSON.stringify({ error: "failed-create-provider", detail: createdProv }), { status: 500, headers: { "Content-Type": "application/json" } });
            return Response.redirect("/auth/error?reason=create_provider_failed", 302);
          }
        }
      } else {
        console.error("could not insert user", addUserBody);
        if (debug) return new Response(JSON.stringify({ addUserError: addUserBody }), { status: 502, headers: { "Content-Type": "application/json" } });
        return Response.redirect("/auth/error?reason=create_user_failed", 302);
      }
    }

    // we should have a user id by now, now we ensure a provider row exists
    const provExistsRes = await fetch(new URL(`/api/auth/user-providers?provider=google&provider_user_id=${encodeURIComponent(userInfoData.sub)}`, origin).toString(), { method: "GET", headers: { "Content-Type": "application/json" } });
    const provExistsList = await provExistsRes.json().catch(() => []);
    if (!(Array.isArray(provExistsList) && provExistsList.length)) {
      const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;
      await fetch(new URL("/api/auth/user-providers", origin).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, provider_user_id: userInfoData.sub ?? null, provider: "google", refresh_token: tokenData.refresh_token, token_expires_at: expiresAt }),
      });
    }
  } catch (err) {
    console.error("callback onRequest error", err);
    if (debug) return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    return Response.redirect(origin, 302);
  }
  return Response.redirect(origin, 302);
}