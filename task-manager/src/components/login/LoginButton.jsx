import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUsers } from '../../contexts/UsersContext.jsx';

export default function LoginButton() {
    const { isAuthenticated, currentUser, logout, authLoading } = useUsers();
    const navigate = useNavigate();
    const location = useLocation();

    if (authLoading) return null;
    if (!isAuthenticated && location.pathname === '/login') return null;

    if (isAuthenticated && currentUser) {
        return (
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <Link
            to='/login'
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
            aria-label='Login'
        >
            Login
        </Link>
    );

}
