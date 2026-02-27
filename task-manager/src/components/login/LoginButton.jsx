import { Link } from "react-router-dom";

export default function LoginButton() {
  return (
    <Link
      to="/login"
      className="fixed top-6 right-6 z-50 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
      aria-label="Login"
    >
      Login
    </Link>
  );
}
