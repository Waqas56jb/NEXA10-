import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const open = ['/login', '/signup', '/reset'].includes(location.pathname);
  const [tab, setTab] = useState('login');
  const [resetStep, setResetStep] = useState(1);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.pathname === '/signup') setTab('signup');
    else if (location.pathname === '/reset') setTab('reset');
    else setTab('login');
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('auth-open', open);
    return () => document.body.classList.remove('auth-open');
  }, [open]);

  if (!open) return null;

  const close = () => navigate('/');
  const switchTab = (t) => { setTab(t); navigate('/' + t); if (t === 'reset') setResetStep(1); };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = () => {
    const e = {};
    if (!emailOk(loginEmail)) e.loginEmail = true;
    if (loginPw.length < 8) e.loginPw = true;
    setErrors(e);
    if (!Object.keys(e).length) navigate('/dashboard');
  };

  return (
    <div id="authPage" className="is-open" aria-hidden="false">
      <div className="auth-layout">
        <div className="left-panel">
          <div className="left-grid" />
          <div className="left-logo">
            <div className="logo-row"><div className="logo-icon">N</div><span className="logo-name">NEXA10.com</span></div>
            <div className="logo-tagline">We Trade Your Capital. You Earn.</div>
          </div>
          <div className="left-hero">
            <h1>Capital In.<br /><span>We Trade It.</span></h1>
            <p>Join investors who allocate funds to NEXA10. Our AI-assisted desk runs Forex, Crypto, and Stocks for you.</p>
            <div className="stats-row">
              {[['94%', 'Accuracy'], ['12K+', 'Investors'], ['$8M+', 'Profits'], ['24/7', 'AI Active']].map(([n, l]) => (
                <div key={l} className="stat-mini"><span className="stat-mini-num">{n}</span><span className="stat-mini-label">{l}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="right-inner">
            <button type="button" className="back-to-site" onClick={close}>← Back to NEXA10.com</button>
            <div className="auth-tabs">
              <button type="button" className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
              <button type="button" className={`tab-btn${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')}>Invest</button>
              {tab === 'reset' && <button type="button" className="tab-btn active">Reset</button>}
            </div>
            {tab === 'login' && (
              <div className="auth-form active">
                <div className="form-head"><h2>Welcome <span>Back</span></h2><p>Sign in to access your AI trading dashboard</p></div>
                <div className="field-group">
                  <div className="field">
                    <label>Email Address</label>
                    <div className={`input-wrap${errors.loginEmail ? ' error' : ''}`}>
                      <span className="input-icon">✉</span>
                      <input className="field-input" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@email.com" />
                    </div>
                    {errors.loginEmail && <span className="field-error show">Please enter a valid email address</span>}
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <div className="input-wrap">
                      <span className="input-icon">🔒</span>
                      <input className="field-input" type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="Enter your password" />
                    </div>
                    {errors.loginPw && <span className="field-error show">Password must be at least 8 characters</span>}
                  </div>
                </div>
                <div className="forgot-row"><button type="button" className="forgot-link" onClick={() => switchTab('reset')}>Forgot password?</button></div>
                <br />
                <button type="button" className="btn-submit" onClick={handleLogin}>Sign In to NEXA10 →</button>
                <div className="switch-text">Don't have an account? <button type="button" className="switch-link" onClick={() => switchTab('signup')}>Create one free →</button></div>
              </div>
            )}
            {tab === 'signup' && (
              <div className="auth-form active">
                <div className="form-head"><h2>Start Your <span>Investment</span></h2><p>Create your investor profile</p></div>
                <div className="field-group">
                  <div className="field"><label>Create Password</label><div className="input-wrap"><span className="input-icon">🔒</span><input className="field-input" type="password" value={signupPw} onChange={(e) => setSignupPw(e.target.value)} /></div></div>
                  <div className="field"><label>Confirm Password</label><div className="input-wrap"><span className="input-icon">🔒</span><input className="field-input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div></div>
                </div>
                <button type="button" className="btn-submit" onClick={() => navigate('/dashboard')}>Open Investor Account →</button>
                <div className="switch-text">Already have an account? <button type="button" className="switch-link" onClick={() => switchTab('login')}>Sign in →</button></div>
              </div>
            )}
            {tab === 'reset' && (
              <div className="auth-form active">
                <div className="form-head"><h2>Reset <span>Password</span></h2></div>
                {resetStep === 1 && (
                  <>
                    <div className="field"><label>Email</label><div className="input-wrap"><input className="field-input" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} /></div></div>
                    <button type="button" className="btn-submit" onClick={() => emailOk(resetEmail) ? setResetStep(2) : setErrors({ resetEmail: true })}>Send OTP →</button>
                  </>
                )}
                {resetStep === 2 && (
                  <>
                    <div className="otp-row">{otp.map((v, i) => (<input key={i} className="otp-input" maxLength={1} value={v} onChange={(e) => { const n = [...otp]; n[i] = e.target.value; setOtp(n); }} />))}</div>
                    <button type="button" className="btn-submit" onClick={() => setResetStep(4)}>Verify →</button>
                  </>
                )}
                {resetStep === 4 && (
                  <div className="reset-sent show"><div className="reset-sent-icon">✓</div><h3>Password Updated!</h3><button type="button" className="btn-submit" onClick={() => switchTab('login')}>Sign In →</button></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
