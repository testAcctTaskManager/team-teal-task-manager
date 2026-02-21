import './Login.css';
import { GoogleSignInButton } from './GoogleSignInButton';

export default function LoginPage() {
  return (
    <div className='login-page'>
      <h2>Sign in</h2>
      <GoogleSignInButton />
    </div>
  )
}
