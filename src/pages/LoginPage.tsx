import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { erpnextConfig } from '../config/erpnext';
import { useAuthStore } from '../store/authStore';
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
      const response = await fetch(`${erpnextConfig.baseUrl}/api/method/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          usr: username,
          pwd: password,
        }),
        credentials: 'include',
      });
      const raw = await response.text();
      let payload: { full_name?: string; message?: string; error?: string; raw?: string } | null = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = { raw };
      }
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || payload?.raw || 'Login failed');
      }

      setUser({
        username,
        displayName: payload?.full_name || username,
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
        <p>Use your credentials to access the workspace.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error ? <p className="login-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
