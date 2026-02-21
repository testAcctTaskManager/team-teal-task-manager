import './GoogleSignInButton.css';

export function GoogleSignInButton() {
    const handleClick = () => {
        window.location.href = "/api/auth/login";
    }

    return (
        <button
            type="button"
            className="google-sign-in-button"
            onClick={handleClick}
            aria-label="Sign in with Google"
        >
            <span
                className="google-logo"
                aria-hidden
            >
                <svg viewBox="0 0 48 48" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.35 1.53 8.26 2.8l6.06-6.06C35.68 3.4 30.18 1 24 1 14.73 1 6.95 6.86 3.7 14.9l7.1 5.5C12.6 15.1 17.7 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.5 24.5c0-1.6-.13-2.8-.4-4H24v8h12.73c-.56 3-3.1 7.2-8.73 9.8l6.7 5.2C42.6 38.9 46.5 32.6 46.5 24.5z"/>
                <path fill="#FBBC05" d="M11.8 29.9c-.8-2.2-1.3-4.6-1.3-7s.5-4.8 1.3-7L4 10.4C1.4 14.3 0 19.1 0 24.9c0 5.9 1.4 10.7 4 14.6l7.8-9.6z"/>
                <path fill="#EA4335" d="M24 46.9c6.18 0 11.68-2.4 15.62-6.2l-7.66-5.96c-2 1.26-4.95 2.2-7.96 2.2-6.32 0-11.42-5.6-12.72-13.2l-7.1 5.5C6.95 41 14.73 46.9 24 46.9z"/>
                </svg>
            </span>
            <span>Sign in with Google</span>
        </button>
    )
}