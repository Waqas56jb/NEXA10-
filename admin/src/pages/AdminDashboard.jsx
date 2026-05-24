import { Link } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';

export default function AdminDashboard() {
  const { users, deposits, pendingDeposits, notifications, stats, loading, error } = useAdminData();
  const approved = deposits.filter((d) => d.status === 'approved');
  const totalBalance = stats?.totalBalance ?? users.reduce((s, u) => s + (u.balance || 0), 0);

  const statCards = [
    { label: 'Total Users', value: stats?.users ?? users.length, color: 'cyan', to: '/users' },
    { label: 'Pending Deposits', value: stats?.pendingDeposits ?? pendingDeposits.length, color: 'amber', to: '/deposits' },
    { label: 'Approved Deposits', value: stats?.approvedDeposits ?? approved.length, color: 'green', to: '/deposits' },
    { label: 'Total Balance', value: `$${Number(totalBalance).toFixed(2)}`, color: 'purple', to: '/users' },
    { label: 'Notifications', value: stats?.activeNotifications ?? notifications.length, color: 'blue', to: '/notifications' },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <p className="admin-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Dashboard Overview</h2>
      <div className="admin-stats-grid">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className={`admin-stat-card admin-stat-card--${s.color}`}>
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value">{s.value}</span>
          </Link>
        ))}
      </div>
      <div className="admin-panels-row">
        <section className="admin-panel">
          <h3>Recent Pending Deposits</h3>
          {pendingDeposits.length === 0 ? (
            <p className="admin-empty">No pending deposits</p>
          ) : (
            <ul className="admin-mini-list">
              {pendingDeposits.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <span>{d.username || d.email}</span>
                  <span className="admin-amount">${d.amount} USDT</span>
                  <span className="admin-tag">{d.exchange}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/deposits" className="admin-link">View all deposits →</Link>
        </section>
        <section className="admin-panel">
          <h3>Recent Users</h3>
          {users.length === 0 ? (
            <p className="admin-empty">No users yet</p>
          ) : (
            <ul className="admin-mini-list">
              {[...users].slice(0, 5).map((u) => (
                <li key={u.id}>
                  <span>{u.username}</span>
                  <span className="admin-muted">{u.email}</span>
                  <span className={`admin-tag${u.blocked ? ' admin-tag--danger' : ''}`}>{u.blocked ? 'Blocked' : 'Active'}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/users" className="admin-link">Manage users →</Link>
        </section>
      </div>
    </div>
  );
}
