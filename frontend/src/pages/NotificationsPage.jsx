import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/notifications.css';

const NEWS = [
  { text: 'Due to network issues, JazzCash and EasyPaisa transactions may be delayed.', time: '2 hours ago' },
  { text: 'NEXA10 is built on robust technology — a full system with a 24/7 team behind it.', time: '1 day ago' },
  { text: 'New withdrawal processing windows are now live in your investor dashboard.', time: '3 days ago' },
  { text: 'Referral commission rates updated — check Levels for details.', time: '5 days ago' },
  { text: 'Scheduled maintenance completed. All systems operational.', time: '1 week ago' },
];

export default function NotificationsPage() {
  return (
    <>
      <Particles /><BgGrid />
      <PageTop title="Latest News" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22V4a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>} />
      <main className="news-main">
        <div className="intro-card"><h2 id="introTitle">Platform Updates</h2><p>Stay informed about NEXA10 news and announcements.</p></div>
        <div className="news-list" role="list">
          {NEWS.map((n, i) => (
            <article key={i} className="news-item" role="listitem">
              <div className="news-item-body"><span className="news-dot" /><p className="news-text">{n.text}</p></div>
              <time className="news-meta">{n.time}</time>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
