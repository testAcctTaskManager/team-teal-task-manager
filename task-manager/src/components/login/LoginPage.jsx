import './Login.css';
import { GoogleSignInButton } from './GoogleSignInButton';

export default function LoginPage() {
  const authURLParams = new URLSearchParams({
            client_id: import.meta.env.GOOGLE_CLIENT_ID,
            redirect_uri: import.meta.env.GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile'
        })
  const authURL = new URL(import.meta.env.VITE_GOOGLE_AUTH_URL)
  authURL.search = authURLParams.toString()

  return (
    <div
      className='login-page'
    >
      <h2>Sign in</h2>

      <GoogleSignInButton authURL={authURL.toString()} />
    </div>
  )
}
