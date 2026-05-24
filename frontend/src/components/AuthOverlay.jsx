import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, signupUser } from '../lib/storage';
import { isApiEnabled, setUserToken, userApi } from '../lib/api';
import { useAppData } from '../context/AppDataContext';

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, marginLeft: 6, verticalAlign: 'middle' }}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 32, height: 32 }}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function AuthOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAppData();
  const open = ['/login', '/signup', '/reset'].includes(location.pathname);
  const [tab, setTab] = useState('login');
  const [resetStep, setResetStep] = useState(1);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

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

  const handleLogin = async () => {
    const e = {};
    if (!emailOk(loginEmail)) e.loginEmail = true;
    if (loginPw.length < 8) e.loginPw = true;
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (isApiEnabled()) {
        const { token } = await userApi.login(loginEmail, loginPw);
        setUserToken(token);
        await refresh();
      } else {
        const result = loginUser(loginEmail, loginPw);
        if (!result) {
          setErrors({ loginPw: true });
          return;
        }
        if (result.error === 'blocked') {
          alert('Your account has been blocked. Contact support.');
          return;
        }
      }
      navigate('/dashboard');
    } catch (err) {
      setErrors({ loginPw: true });
      alert(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    const e = {};
    if (!emailOk(signupEmail)) e.signupEmail = true;
    if (signupPw.length < 8) e.signupPw = true;
    if (signupPw !== confirmPw) e.confirmPw = true;
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (isApiEnabled()) {
        const { token } = await userApi.register(
          signupEmail,
          signupUsername || signupEmail.split('@')[0],
          signupPw,
        );
        setUserToken(token);
        await refresh();
      } else {
        const result = signupUser({
          email: signupEmail,
          username: signupUsername || signupEmail.split('@')[0],
          password: signupPw,
        });
        if (result?.error === 'exists') {
          alert('An account with this email already exists.');
          return;
        }
      }
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  // Shared input props that force English keyboards / no autocorrect / no autocapitalize
  const englishInput = {
    lang: 'en',
    spellCheck: false,
    autoCorrect: 'off',
    autoCapitalize: 'none',
    autoComplete: 'off',
  };
  const emailInput = { ...englishInput, type: 'email', inputMode: 'email', autoComplete: 'email' };
  const passwordInput = { ...englishInput, type: 'password', autoComplete: 'current-password' };
  const newPasswordInput = { ...englishInput, type: 'password', autoComplete: 'new-password' };
  const textInput = { ...englishInput, type: 'text', inputMode: 'text' };
  const numericInput = { ...englishInput, type: 'text', inputMode: 'numeric', pattern: '[0-9]*' };

  return (
    <div id="authPage" className="is-open" aria-hidden="false" lang="en">
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
            <button type="button" className="back-to-site" onClick={close}>
              <IconArrowLeft />Back to NEXA10.com
            </button>
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
                      <span className="input-icon"><IconMail /></span>
                      <input
                        className="field-input"
                        {...emailInput}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@email.com"
                      />
                    </div>
                    {errors.loginEmail && <span className="field-error show">Please enter a valid email address</span>}
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconLock /></span>
                      <input
                        className="field-input"
                        {...passwordInput}
                        value={loginPw}
                        onChange={(e) => setLoginPw(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                    {errors.loginPw && <span className="field-error show">Password must be at least 8 characters</span>}
                  </div>
                </div>
                <div className="forgot-row"><button type="button" className="forgot-link" onClick={() => switchTab('reset')}>Forgot password?</button></div>
                <br />
                <button type="button" className="btn-submit" onClick={handleLogin} disabled={busy}>
                  {busy ? 'Signing in...' : (<>Sign In to NEXA10<IconArrowRight /></>)}
                </button>
                <div className="switch-text">
                  Don't have an account?{' '}
                  <button type="button" className="switch-link" onClick={() => switchTab('signup')}>
                    Create one free<IconArrowRight />
                  </button>
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <div className="auth-form active">
                <div className="form-head"><h2>Start Your <span>Investment</span></h2><p>Create your investor profile</p></div>
                <div className="field-group">
                  <div className="field">
                    <label>Email Address</label>
                    <div className={`input-wrap${errors.signupEmail ? ' error' : ''}`}>
                      <span className="input-icon"><IconMail /></span>
                      <input
                        className="field-input"
                        {...emailInput}
                        autoComplete="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@email.com"
                      />
                    </div>
                    {errors.signupEmail && <span className="field-error show">Please enter a valid email</span>}
                  </div>
                  <div className="field">
                    <label>Username</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconUser /></span>
                      <input
                        className="field-input"
                        {...textInput}
                        autoComplete="username"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="Your display name"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Create Password</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconLock /></span>
                      <input
                        className="field-input"
                        {...newPasswordInput}
                        value={signupPw}
                        onChange={(e) => setSignupPw(e.target.value)}
                        placeholder="Min. 8 characters"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="input-wrap">
                      <span className="input-icon"><IconLock /></span>
                      <input
                        className="field-input"
                        {...newPasswordInput}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-submit" onClick={handleSignup} disabled={busy}>
                  {busy ? 'Creating account...' : (<>Open Investor Account<IconArrowRight /></>)}
                </button>
                <div className="switch-text">
                  Already have an account?{' '}
                  <button type="button" className="switch-link" onClick={() => switchTab('login')}>
                    Sign in<IconArrowRight />
                  </button>
                </div>
              </div>
            )}

            {tab === 'reset' && (
              <div className="auth-form active">
                <div className="form-head"><h2>Reset <span>Password</span></h2></div>
                {resetStep === 1 && (
                  <>
                    <div className="field">
                      <label>Email</label>
                      <div className={`input-wrap${errors.resetEmail ? ' error' : ''}`}>
                        <span className="input-icon"><IconMail /></span>
                        <input
                          className="field-input"
                          {...emailInput}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <button type="button" className="btn-submit" onClick={() => emailOk(resetEmail) ? setResetStep(2) : setErrors({ resetEmail: true })}>
                      Send OTP<IconArrowRight />
                    </button>
                  </>
                )}
                {resetStep === 2 && (
                  <>
                    <div className="otp-row">
                      {otp.map((v, i) => (
                        <input
                          key={i}
                          className="otp-input"
                          maxLength={1}
                          {...numericInput}
                          value={v}
                          onChange={(e) => { const n = [...otp]; n[i] = e.target.value.replace(/[^0-9]/g, ''); setOtp(n); }}
                        />
                      ))}
                    </div>
                    <button type="button" className="btn-submit" onClick={() => setResetStep(4)}>
                      Verify<IconArrowRight />
                    </button>
                  </>
                )}
                {resetStep === 4 && (
                  <div className="reset-sent show">
                    <div className="reset-sent-icon" style={{ color: 'var(--neon-green)' }}><IconCheck /></div>
                    <h3>Password Updated!</h3>
                    <button type="button" className="btn-submit" onClick={() => switchTab('login')}>
                      Sign In<IconArrowRight />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
