import { Link } from 'react-router-dom';
import './LoginButton.css';

export default function LoginButton() {
    return (
        <Link to='/login'
            className='login-button'
            aria-label='Login'
        >
            Login
        </Link>
    );
}