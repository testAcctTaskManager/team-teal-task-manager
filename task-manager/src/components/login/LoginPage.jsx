import { GoogleSignInButton } from "./GoogleSignInButton";

export default function LoginPage() {
  const search =
    typeof window !== "undefined" && window.location
      ? window.location.search
      : "";
  const authError = new URLSearchParams(search).get("auth_error");
  const showLoginError = authError === "login_failed";

  return (

    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 rounded-lg shadow-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white m-0 text-center">
            Sign in
          </h2>
        </div>
        <div className="p-8">
          {showLoginError && (
            <div
              className="mb-4 rounded-md border border-red-300/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
              role="alert"
            >
              Unable to log in. Please try again or contact your admin.
            </div>
          )}
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
