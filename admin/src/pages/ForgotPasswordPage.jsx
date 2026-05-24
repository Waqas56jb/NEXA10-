import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../lib/api';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetUrl('');
    setLoading(true);
    try {
      const data = await adminApi.forgotPassword(email);
      setSuccess(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message);
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
          <h1>Reset Password</h1>
          <p>Enter your admin email to receive a reset link.</p>
          <div className="admin-field">
            <label htmlFor="forgot-email">Admin Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexa10.com"
              required
            />
          </div>
          {error && <p className="admin-error">{error}</p>}
          {success && <p className="admin-success">{success}</p>}
          {resetUrl && (
            <p className="admin-login-hint">
              Dev reset link: <Link to={resetUrl.replace(window.location.origin, '')}>{resetUrl}</Link>
            </p>
          )}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link →'}
          </button>
          <p className="admin-login-links">
            <Link to="/login">← Back to login</Link>
          </p>
        </form>
      </div>
    </>
  );
}
