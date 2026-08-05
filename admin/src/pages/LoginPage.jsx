import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { adminApi, isAdminTokenValid, setAdminToken } from '../lib/api';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const expired = Boolean(location.state?.expired);

  if (isAdminTokenValid()) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminApi.login(email, password);
      setAdminToken(token);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Particles />
      <BgGrid />
      <div className="admin-login-wrap">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <img src="/logo.png" alt="NEXA10" className="admin-login-logo" width={48} height={48} />
          <h1>Admin Panel</h1>
          <p>NEXA10 control center — manage users, deposits & notifications</p>
          {expired && !error && (
            <p className="admin-error">Your session expired. Please sign in again.</p>
          )}
          <div className="admin-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@nexa10.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-pw">Password</label>
            <input
              id="admin-pw"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
          <p className="admin-login-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
        </form>
      </div>
    </>
  );
}
