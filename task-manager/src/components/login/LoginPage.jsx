import './Login.css';
import { GoogleSignInButton } from './GoogleSignInButton';

export default function LoginPage() {
  const authURL = import.meta.env.VITE_GOOGLE_AUTH_URL

  return (
    <div
      className='login-page'
    >
      <h2>Sign in</h2>

      <GoogleSignInButton authURL={authURL} />
    </div>
  )
}
