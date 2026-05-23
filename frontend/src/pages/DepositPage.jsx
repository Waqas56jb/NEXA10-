import { useState } from 'react';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/deposit.css';

const methods = [
  { id: 'easypaisa', name: 'EasyPaisa', sub: 'Deposit: USD', cls: 'easypaisa' },
  { id: 'jazzcash', name: 'JazzCash', sub: 'Deposit: USD', cls: 'jazzcash' },
  { id: 'bank', name: 'Bank Transfer', sub: 'Direct Bank Deposit', cls: 'bank' },
];

const payIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="5" /><circle cx="15" cy="15" r="5" />
  </svg>
);

const bankIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M9 10h6" />
  </svg>
);

export default function DepositPage() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <Particles />
      <BgGrid />
      <PageTop
        title="Deposit Funds"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 14h4" />
          </svg>
        }
      />
      <main className="deposit-main">
        <div className="deposit-panel">
          <div className="panel-head">
            <div className="panel-head-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 9h6v6H9z" />
                <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
              </svg>
            </div>
            <div className="panel-head-text">
              <h2>Select Payment Method</h2>
              <p>Add funds to your account</p>
            </div>
          </div>
          <p className="methods-label" id="methodsLabel">Payment Methods</p>
          <ul className="methods-list" role="listbox" aria-labelledby="methodsLabel">
            {methods.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`pay-card ${m.cls}${selected === m.id ? ' selected' : ''}`}
                  role="option"
                  aria-selected={selected === m.id}
                  onClick={() => setSelected(m.id)}
                >
                  <span className="pay-info">
                    <span className="pay-name">{m.name}</span>
                    <span className="pay-sub">{m.sub}</span>
                  </span>
                  <span className="pay-icon-wrap" aria-hidden="true">{m.id === 'bank' ? bankIcon : payIcon}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className={`continue-wrap${selected ? ' visible' : ''}`}>
            <button
              type="button"
              className="btn-continue"
              onClick={() => selected && alert(`Payment details for ${selected} will open here. Connect your backend.`)}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
