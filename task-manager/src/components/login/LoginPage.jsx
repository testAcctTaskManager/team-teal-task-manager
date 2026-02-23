import { GoogleSignInButton } from "./GoogleSignInButton";

export default function LoginPage() {
  const authURLParams = new URLSearchParams({
    // todo: remove fallbacks once implemented
    client_id:
      "459719729310-mf1vkob8e7ljhcn44obrujolbsfpil27.apps.googleusercontent.com",
    redirect_uri:
      "https://joel-logon-component-tt2s-39.team-teal-task-manager.pages.dev/api/auth/callback",
    response_type: "code",
    scope: "openid email profile",
  });
  const authURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authURL.search = authURLParams.toString();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 rounded-lg shadow-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white m-0 text-center">
            Sign in
          </h2>
        </div>
        <div className="p-8">
          <GoogleSignInButton authURL={authURL.toString()} />
        </div>
      </div>
    </div>
  );
}
