import { GoogleSignInButton } from "./GoogleSignInButton";

export default function LoginPage() {
  return (

    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 rounded-lg shadow-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white m-0 text-center">
            Sign in
          </h2>
        </div>
        <div className="p-8">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
