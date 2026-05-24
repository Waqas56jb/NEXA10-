import { useEffect, useState } from 'react';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/invest.css';

const HOURLY_RATE = 0.0018;
const PLAN_HOURS = 2160;

function formatMoney(n) {
  if (n === 0) return '$0.00';
  const abs = Math.abs(n);
  if (abs < 0.01) return '$' + n.toFixed(4);
  if (abs < 1) return '$' + n.toFixed(3);
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvestPage() {
  const [calcOpen, setCalcOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [returns, setReturns] = useState({ hourly: 0, daily: 0, weekly: 0, monthly: 0, total: 0 });

  useEffect(() => {
    const a = Math.max(0, parseFloat(amount) || 0);
    const hourly = a * HOURLY_RATE;
    const daily = hourly * 24;
    setReturns({ hourly, daily, weekly: daily * 7, monthly: daily * 30, total: hourly * PLAN_HOURS });
  }, [amount]);

  useEffect(() => {
    document.body.style.overflow = calcOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [calcOpen]);

  return (
    <>
      <Particles />
      <BgGrid />
      <PageTop
        title="AI Plans"
        extra={
          <button type="button" className="calc-btn" onClick={() => setCalcOpen(true)}>Calculator</button>
        }
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></svg>}
      />
      <main className="invest-main">
        <article className="plan-card">
          <div className="plan-top">
            <div className="plan-name-block"><h2>NEXA10 Starter</h2><p>A plan to start a future</p></div>
            <span className="badge-active">Active</span>
          </div>
          <div className="stats-row">
            <div className="stat-box stat-box--profit"><span className="stat-label">Profit</span><div className="stat-value">0.18%</div></div>
            <div className="stat-box stat-box--duration"><span className="stat-label">Duration</span><div className="stat-value">2160 hours</div></div>
          </div>
          <div className="range-box">
            <div className="range-left"><div><div className="range-label">Investment Range</div><div className="range-value">$1 – $10,000,000</div></div></div>
            <span className="badge-hourly">Hourly</span>
          </div>
          <button type="button" className="btn-invest" onClick={() => alert('Connect backend for investment flow')}>Invest Now</button>
        </article>
      </main>
      <div className={`calc-overlay${calcOpen ? ' open' : ''}`} hidden={!calcOpen} onClick={(e) => e.target === e.currentTarget && setCalcOpen(false)}>
        <div className="calc-modal" role="dialog">
          <div className="calc-modal-head">
            <div className="calc-modal-title">Profit Calculator</div>
            <button type="button" className="calc-close" onClick={() => setCalcOpen(false)}>✕</button>
          </div>
          <div className="calc-modal-body">
            <div className="plan-pill"><strong>NEXA10 Starter</strong> · 0.18% hourly</div>
            <div className="calc-field">
              <label htmlFor="calcAmount">Investment Amount</label>
              <div className="amount-wrap">
                <span className="amount-prefix">$</span>
                <input id="calcAmount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="returns-grid">
              {[['Hourly', returns.hourly, 'hourly'], ['Daily', returns.daily, 'daily'], ['Weekly', returns.weekly, 'weekly'], ['Monthly', returns.monthly, 'monthly']].map(([l, v, c]) => (
                <div key={l} className={`return-card return-card--${c}`}><span className="return-card-label">{l}</span><div className="return-card-value">{formatMoney(v)}</div></div>
              ))}
            </div>
            <div className="total-return-box">
              <div><div className="total-label">Total Return</div><div className="total-sub">Over 2160 hours</div></div>
              <div className="total-return-value">{formatMoney(returns.total)}</div>
            </div>
            <button type="button" className="btn-calc-close" onClick={() => setCalcOpen(false)}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}
