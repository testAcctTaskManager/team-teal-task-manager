const PAGES_DEV_SUFFIX = ".team-teal-task-manager.pages.dev";
const COOKIE_DOMAIN = "team-teal-task-manager.pages.dev";

function isLocalhost(hostname) {
  const h = hostname.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

export async function onRequestPost({ request }) {
  const hostname = request.headers.get("host") || "";
  const secure = isLocalhost(hostname) ? "" : " Secure;";
  let cookie = `session=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
  if (hostname === COOKIE_DOMAIN || hostname.endsWith(PAGES_DEV_SUFFIX)) {
    cookie += `; Domain=${COOKIE_DOMAIN}`;
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
}
