export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        // todo: figure out where errors should route
        console.error(error)
        return Response.redirect('/', 302);
    }
    if (!code) {
        return new Response('missing code', { status: 400 });
    }

    // send code to google, get token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        // todo: figure out where errors should route
        console.error('token exchange failed', tokenData);
        return Response.redirect('/', 302);
    }

    // fetch user info
    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfoData = await userInfoRes.json();
    if (!userInfoRes.ok) {
        console.error('could not fetch user info', userInfoData);
        return Response.redirect('/', 302);
    }

    // add user
    const addUser = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            display_name: userInfoData.name,
            email: userInfoData.id_token.email
        })
    })

    const userData = await addUser.json();
    if (!userData.ok) {
        // todo: figure out where errors should route
        console.error('could not insert user', userData);
        return Response.redirect('/', 302);
    }

    // add user to providers table using id_token.sub
    const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;
    const addUserProviderRes = await fetch('/api/auth/user-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: userInfoData.sub ?? null, // match DB/handler if needed
            user_id: userData.id,
            provider: 'google',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt
        })
    })
    const addUserProviderData = addUserProviderRes.json();
    if (!addUserProviderData.ok) {
        // todo: figure out where errors should route
        console.error('could not insert user', userData);
        return Response.redirect('/', 302);
    }
    
    return Response.redirect('/', 302);
}