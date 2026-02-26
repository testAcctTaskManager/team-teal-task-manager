import { Link, useNavigate } from 'react-router-dom';
import { useUsers } from '../../contexts/UsersContext.jsx';
//import './LoginButton.css';

export default function LoginButton() {
    const { isAuthenticated, currentUser, logout, authLoading } = useUsers();
    const navigate = useNavigate();

    if (authLoading) return null;

    if (isAuthenticated && currentUser) {
        return (
            <div className="login-button" style={{ gap: '8px', cursor: 'default' }}>
                <span>{currentUser.display_name}</span>
                <button
                    type="button"
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <Link to='/login'
            className='login-button'
            aria-label='Login'
        >
            Login
        </Link>
    );

}
