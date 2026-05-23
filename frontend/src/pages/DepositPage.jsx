import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/deposit.css';

const BINANCE_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg';
const MEXC_LOGO = 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png';

const methods = [
  { id: 'binance', name: 'Binance', sub: 'Deposit: USDT', cls: 'binance', icon: 'logo', logoUrl: BINANCE_LOGO },
  { id: 'mexc', name: 'MEXC', sub: 'Deposit: USDT', cls: 'mexc', icon: 'logo', logoUrl: MEXC_LOGO },
];

export default function DepositPage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'binance') {
      navigate('/deposit/binance');
      return;
    }
    if (selected === 'mexc') {
      navigate('/deposit/mexc');
    }
  };

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
                  <span className="pay-icon-wrap" aria-hidden="true">
                    <img src={m.logoUrl} alt="" width={28} height={28} loading="lazy" decoding="async" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className={`continue-wrap${selected ? ' visible' : ''}`}>
            <button
              type="button"
              className="btn-continue"
              onClick={handleContinue}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
