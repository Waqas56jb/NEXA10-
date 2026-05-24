import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../lib/api';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link — missing token');
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi.resetPassword(token, password);
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 2000);
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
          <h1>New Password</h1>
          <p>Choose a strong password for your admin account.</p>
          <div className="admin-field">
            <label htmlFor="new-pw">New Password</label>
            <input
              id="new-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="confirm-pw">Confirm Password</label>
            <input
              id="confirm-pw"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>
          {error && <p className="admin-error">{error}</p>}
          {success && <p className="admin-success">{success}</p>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={loading || !token}>
            {loading ? 'Updating...' : 'Update Password →'}
          </button>
          <p className="admin-login-links">
            <Link to="/login">← Back to login</Link>
          </p>
        </form>
      </div>
    </>
  );
}
