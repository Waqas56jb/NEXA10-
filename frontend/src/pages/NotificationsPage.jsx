import { Link } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import { useAppData } from '../context/AppDataContext';
import { formatTimeAgo } from '../lib/storage';
import '../styles/pages/notifications.css';

function fmtMoney(n) {
  return Number(n || 0).toFixed(2);
}

function statusLabel(w) {
  if (w.status === 'pending') return 'Pending admin approval — funds reach your bank within 24 hours of approval.';
  if (w.status === 'approved') return `Approved — payout sent to ${w.accountHolderName}.`;
  if (w.status === 'rejected') return `Rejected${w.adminNote ? ` (${w.adminNote})` : ''} — balance refunded.`;
  return '';
}

export default function NotificationsPage() {
  const { notifications, withdrawals = [] } = useAppData();
  const recentWithdrawals = withdrawals.slice(0, 5);

  return (
    <>
      <Particles /><BgGrid />
      <PageTop
        title="Latest News"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 22V4a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          </svg>
        }
      />
      <main className="news-main">
        <div className="intro-card">
          <h2 id="introTitle">Platform Updates</h2>
          <p>Stay informed about NEXA10 news and announcements.</p>
        </div>

        {recentWithdrawals.length > 0 && (
          <>
            <h3 className="news-section-title">Your Withdrawals</h3>
            <div className="news-list" role="list">
              {recentWithdrawals.map((w) => (
                <article key={w.id} className={`news-item news-item--${w.status}`} role="listitem">
                  <div className="news-item-body">
                    <span className={`news-dot news-dot--${w.status}`} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p className="news-text">
                        <strong>${fmtMoney(w.amount)}</strong> · {statusLabel(w)}
                      </p>
                      <span style={{ fontSize: '0.78rem', color: '#8899bb' }}>
                        To {w.accountHolderName} · acct ending {String(w.accountNumber).slice(-4)}
                      </span>
                    </div>
                  </div>
                  <time className="news-meta">{formatTimeAgo(w.createdAt)}</time>
                </article>
              ))}
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
              <Link to="/withdraw" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600 }}>
                Manage withdrawals →
              </Link>
            </div>
            <h3 className="news-section-title">Announcements</h3>
          </>
        )}

        <div className="news-list" role="list">
          {notifications.length === 0 ? (
            <p className="news-empty" style={{ color: '#8899bb', textAlign: 'center', padding: 24 }}>
              No announcements yet.
            </p>
          ) : (
            notifications.map((n) => (
              <article key={n.id} className="news-item" role="listitem">
                <div className="news-item-body">
                  <span className="news-dot" />
                  <p className="news-text">{n.text}</p>
                </div>
                <time className="news-meta">{formatTimeAgo(n.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </main>
    </>
  );
}
