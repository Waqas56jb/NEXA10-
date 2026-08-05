import { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { formatTimeAgo } from '../lib/api';

export default function AdminNotificationsPage() {
  const { notifications, loading, error, actions } = useAdminData();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  const publish = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await actions.addNotification(text.trim());
      setText('');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    setBusy(true);
    try {
      await actions.deleteNotification(id);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id, active) => {
    setBusy(true);
    try {
      await actions.toggleNotification(id, active);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-page"><p className="admin-muted">Loading notifications...</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Notifications</h2>
      <p className="admin-page-desc">Publish announcements — they appear on the customer notifications page and dashboard bell.</p>
      {error && <p className="admin-error">{error}</p>}

      <form className="admin-panel admin-notif-form" onSubmit={publish}>
        <h3>Post New Notification</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your announcement for all customers..."
          rows={4}
        />
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? 'Publishing...' : 'Publish to Customers →'}
        </button>
      </form>

      <section className="admin-panel">
        <h3>Published ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="admin-empty">No notifications yet</p>
        ) : (
          <ul className="admin-notif-list">
            {sorted.map((n) => (
              <li key={n.id} className={n.active ? '' : 'inactive'}>
                <div className="admin-notif-text">
                  <p>{n.text}</p>
                  <span className="admin-muted">{formatTimeAgo(n.createdAt)}</span>
                </div>
                <div className="admin-notif-actions">
                  <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => toggle(n.id, !n.active)}>
                    {n.active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" disabled={busy} onClick={() => remove(n.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
