import { useSearchParams } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/transactions.css';

const TABS = [
  { id: 'deposits', label: 'Deposits', empty: 'No deposits found', sub: 'Your deposits will appear here once available.' },
  { id: 'withdrawals', label: 'Withdrawals', empty: 'No withdrawals found', sub: 'Your withdrawal history will appear here once available.' },
  { id: 'referrals', label: 'Referrals', empty: 'No referral transactions found', sub: 'Referral commissions will show here when credited.' },
  { id: 'earnings', label: 'Earnings', empty: 'No earnings found', sub: 'Your trading cycle earnings will appear here once credited.' },
];

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'deposits';
  const current = TABS.find((t) => t.id === tab) || TABS[0];

  const setTab = (id) => setParams({ tab: id });

  return (
    <>
      <Particles /><BgGrid />
      <PageTop title="Transactions" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>} />
      <main className="tx-main">
        <div className="tx-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`tx-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="tx-panel">
          <div className="tx-pane active">
            <div className="empty-state">
              <div className="empty-icon">!</div>
              <h2 className="empty-title">{current.empty}</h2>
              <p className="empty-desc">{current.sub}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
