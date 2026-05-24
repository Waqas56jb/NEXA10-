import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import { useAppData } from '../context/AppDataContext';
import { formatTimeAgo } from '../lib/storage';
import '../styles/pages/notifications.css';

export default function NotificationsPage() {
  const { notifications } = useAppData();

  return (
    <>
      <Particles /><BgGrid />
      <PageTop title="Latest News" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22V4a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>} />
      <main className="news-main">
        <div className="intro-card"><h2 id="introTitle">Platform Updates</h2><p>Stay informed about NEXA10 news and announcements.</p></div>
        <div className="news-list" role="list">
          {notifications.length === 0 ? (
            <p className="news-empty" style={{ color: '#8899bb', textAlign: 'center', padding: 24 }}>No announcements yet.</p>
          ) : (
            notifications.map((n) => (
              <article key={n.id} className="news-item" role="listitem">
                <div className="news-item-body"><span className="news-dot" /><p className="news-text">{n.text}</p></div>
                <time className="news-meta">{formatTimeAgo(n.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      </main>
    </>
  );
}
