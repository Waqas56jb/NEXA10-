import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import BottomNav from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { isEarningActive, setEarningActive } from '../lib/storage';
import { getUserToken, isApiEnabled, userApi } from '../lib/api';
import '../styles/pages/dashboard.css';

export default function DashboardPage() {
  const { currentUser, notifications, settings, refresh, loading, apiMode } = useAppData();
  const refLink = settings?.refLink || 'https://nexa10.com/register?ref=81ibdsh3zc';
  const [liveExtra, setLiveExtra] = useState(0);
  const [earning, setEarning] = useState(() => (apiMode ? Boolean(currentUser?.earningActive) : isEarningActive()));
  const [toast, setToast] = useState('');
  const [cycle, setCycle] = useState({ h: 0, m: 0, s: 0 });

  const balance = (currentUser?.balance || 0) + liveExtra;
  const depositTotal = currentUser?.depositTotal || 0;
  const earningsTotal = currentUser?.earningsTotal || 0;

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCycle({ h: 23 - now.getHours(), m: 59 - now.getMinutes(), s: 59 - now.getSeconds() });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!earning || currentUser?.blocked) return;
    const id = setInterval(() => setLiveExtra((b) => b + 0.00000001), 100);
    return () => clearInterval(id);
  }, [earning, currentUser?.blocked]);

  useEffect(() => {
    if (apiMode && currentUser) setEarning(Boolean(currentUser.earningActive));
  }, [apiMode, currentUser?.earningActive, currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleEarn = async () => {
    if (currentUser?.blocked) {
      showToast('Account blocked — contact support');
      return;
    }
    const next = !earning;
    setEarning(next);
    if (apiMode && getUserToken()) {
      try {
        await userApi.setEarning(next);
        await refresh();
      } catch {
        setEarning(!next);
        showToast('Could not update earning status');
      }
    } else {
      setEarningActive(next);
      refresh();
    }
  };

  if (apiMode && !loading && !getUserToken()) {
    return <Navigate to="/login" replace />;
  }

  if (apiMode && loading && !currentUser) {
    return (
      <>
        <Particles connectLines count={60} />
        <BgGrid orbs />
        <main className="main"><p style={{ textAlign: 'center', padding: 40, color: '#8899bb' }}>Loading dashboard...</p></main>
      </>
    );
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      showToast('Copied to clipboard');
    } catch {
      showToast('Copy failed');
    }
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <>
      <Particles connectLines count={60} />
      <BgGrid orbs />
      <header className="app-header">
        <Link to="/dashboard" className="app-logo"><img src="/logo.png" alt="NEXA10" /></Link>
        <div className="header-actions">
          <Link to="/notifications" className="icon-btn" aria-label="Notifications">
            {notifications.length > 0 && <span className="pulse-dot" />}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          </Link>
        </div>
      </header>
      <main className="main">
        {currentUser?.blocked && (
          <section className="card fade-in" style={{ borderColor: 'rgba(255,68,102,0.5)', marginBottom: 16 }}>
            <p style={{ color: '#ff4466', textAlign: 'center', fontWeight: 600 }}>Your account is blocked. Contact support.</p>
          </section>
        )}
        <section className="card earnings-card fade-in d1">
          <div className="card-glow" />
          <div className="earnings-head"><div className="chip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg></div><h2>Live Earnings</h2></div>
          <div className="balance-label"><span className="live-dot" /><span>Current Balance</span></div>
          <div className="balance-amount"><span className="balance-currency">$</span><span>{balance.toFixed(8)}</span></div>
          <div className="cycle-box">
            <span className="cycle-label">Next cycle</span>
            <span className="cycle-time">{pad(cycle.h)}:{pad(cycle.m)}:{pad(cycle.s)}</span>
          </div>
        </section>
        <button className="btn-earn fade-in d2" type="button" onClick={toggleEarn}>
          <span>{earning ? 'Earning Active...' : 'Start Earning Now'}</span>
        </button>
        <section className="card ref-card fade-in d3">
          <div className="ref-info"><div className="ref-title">Your Referral Link</div><div className="ref-url">{refLink}</div></div>
          <div className="ref-actions">
            <button className="ref-btn copy" type="button" onClick={copyRef}>Copy</button>
          </div>
        </section>
        <section className="summary-row fade-in d3">
          <div className="card summary-tile"><span className="summary-label">Invested</span><span className="summary-amount">${depositTotal.toFixed(2)}</span></div>
          <div className="card summary-tile"><span className="summary-label">Earnings</span><span className="summary-amount green">${earningsTotal.toFixed(2)}</span></div>
        </section>
        <section className="actions-grid fade-in d4">
          <Link to="/deposit" className="action-tile deposit"><span className="action-title">Deposit</span><span className="action-sub">Add Funds</span></Link>
          <Link to="/invest" className="action-tile invest"><span className="action-title">Invest</span><span className="action-sub">AI Plans</span></Link>
          <a href="#withdraw" className="action-tile withdraw"><span className="action-title">Withdraw</span><span className="action-sub">Cash Out</span></a>
        </section>
        <section className="card qa-card fade-in d5">
          <div className="qa-head"><span className="qa-head-text">Quick Access</span></div>
          <div className="qa-list">
            {[
              ['/invest', 'Investments', 'Active plans & performance'],
              ['/referrals', 'Referrals', 'Invite friends & earn rewards'],
              ['/transactions', 'Transactions', 'Deposits, withdrawals & history'],
              ['/levels', 'Levels', 'Your rank & tier benefits'],
              ['/notifications', 'News', 'Platform updates & announcements'],
            ].map(([to, name, desc]) => (
              <Link key={to} to={to} className="qa-item">
                <div className="qa-text"><div className="qa-name">{name}</div><div className="qa-desc">{desc}</div></div>
                <span className="qa-arrow">›</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
      {toast && <div className="toast show"><span>{toast}</span></div>}
    </>
  );
}
