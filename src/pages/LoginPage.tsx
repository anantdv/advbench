import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { DEFAULT_ERPNEXT_BASE_URL } from '../config/erpnext';
import logo from '../../cropped-ADV-Logo-300x115.png';

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Login failed');
      }

      setUser({
        username: payload.user.username,
        displayName: payload.user.displayName || payload.user.username,
      });
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <img className="brand-logo login-logo" src={logo} alt="anantdv logo" />
        <h1>Sign in to ADVBench</h1>
        <p>Use your ERPNext credentials to access the workspace.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>ERPNext Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            <span>ERPNext Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error ? <p className="login-error">{error}</p> : null}
        </form>

        <p className="login-footnote">
          ERPNext base URL: <code>{DEFAULT_ERPNEXT_BASE_URL}</code>
        </p>
      </section>
    </main>
  );
}
