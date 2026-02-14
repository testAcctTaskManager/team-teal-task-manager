import './Login.css';
import { GoogleSignInButton } from './GoogleSignInButton';

export default function LoginPage() {
  const authURLParams = new URLSearchParams({
            // todo: remove fallbacks once implemented
            client_id: "459719729310-mf1vkob8e7ljhcn44obrujolbsfpil27.apps.googleusercontent.com",
            redirect_uri: "https://joel-logon-component-tt2s-39.team-teal-task-manager.pages.dev/api/auth/callback",
            response_type: 'code',
            scope: 'openid email profile'
        })
  const authURL = new URL("https://accounts.google.com/o/oauth2/v2/auth")
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
