import { useSearchParams } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import { useAppData } from '../context/AppDataContext';
import { getFundTransfers, formatTimeAgo as localFormatTimeAgo } from '../lib/storage';
import { formatTimeAgo as apiFormatTimeAgo } from '../lib/api';
import '../styles/pages/transactions.css';

const TABS = [
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'earnings', label: 'Earnings' },
];

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'deposits';
  const { currentUser, deposits, fundTransfers, apiMode } = useAppData();
  const formatTimeAgo = apiMode ? apiFormatTimeAgo : localFormatTimeAgo;

  const userDeposits = deposits.filter(
    (d) => d.userId === currentUser?.id || d.email === currentUser?.email || d.username === currentUser?.username
  );
  const transfers = apiMode ? fundTransfers : (currentUser ? getFundTransfers(currentUser.id) : []);
  const withdrawals = transfers.filter((t) => t.type === 'outgoing');
  const incoming = transfers.filter((t) => t.type === 'incoming');

  const setTab = (id) => setParams({ tab: id });

  const renderList = () => {
    if (tab === 'deposits') {
      if (userDeposits.length === 0) return empty('No deposits found', 'Your deposits will appear here once submitted.');
      return (
        <ul className="tx-list">
          {userDeposits.map((d) => (
            <li key={d.id} className="tx-item">
              <div><strong>${d.status === 'approved' && d.approvedAmount != null ? d.approvedAmount : d.amount} USDT</strong> · {d.exchange} {d.network}</div>
              <span className={`tx-status tx-status--${d.status}`}>{d.status}</span>
              <span className="tx-time">{formatTimeAgo(d.createdAt)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (tab === 'withdrawals') {
      if (withdrawals.length === 0) return empty('No withdrawals found', 'Outgoing funds from admin will appear here.');
      return (
        <ul className="tx-list">
          {withdrawals.map((t) => (
            <li key={t.id} className="tx-item">
              <div><strong>-${t.amount.toFixed(2)}</strong> {t.note}</div>
              <span className="tx-time">{formatTimeAgo(t.createdAt)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (tab === 'earnings') {
      if (incoming.length === 0) return empty('No earnings found', 'Approved deposits and credits will appear here.');
      return (
        <ul className="tx-list">
          {incoming.map((t) => (
            <li key={t.id} className="tx-item">
              <div><strong>+${t.amount.toFixed(2)}</strong> {t.note}</div>
              <span className="tx-time">{formatTimeAgo(t.createdAt)}</span>
            </li>
          ))}
        </ul>
      );
    }
    return empty('No referral transactions found', 'Referral commissions will show here when credited.');
  };

  const empty = (title, sub) => (
    <div className="empty-state">
      <div className="empty-icon">!</div>
      <h2 className="empty-title">{title}</h2>
      <p className="empty-desc">{sub}</p>
    </div>
  );

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
          <div className="tx-pane active">{renderList()}</div>
        </div>
      </main>
    </>
  );
}
