import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { setAdminToken } from '../lib/api';
import { useAdminData } from '../context/AdminDataContext';

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5173';

const NAV = [
  { to: '/', end: true, label: 'Overview', icon: '◈' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/deposits', label: 'Deposits', icon: '💰' },
  { to: '/withdrawals', label: 'Withdrawals', icon: '🏧' },
  { to: '/support', label: 'Support', icon: '💬' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function AdminLayout() {
  const {
    users, pendingDeposits, pendingWithdrawals = [], unreadSupportCases = [],
    loading, refreshing, refresh,
  } = useAdminData();
  const totalPending = pendingDeposits.length + pendingWithdrawals.length + unreadSupportCases.length;
  const navigate = useNavigate();

  const logout = () => {
    setAdminToken(null);
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <img src="/logo.png" alt="" width={32} height={32} />
          <div>
            <span className="admin-sidebar-title">NEXA10</span>
            <span className="admin-sidebar-sub">Admin Panel</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
              {item.to === '/deposits' && pendingDeposits.length > 0 && (
                <span className="admin-badge">{pendingDeposits.length}</span>
              )}
              {item.to === '/withdrawals' && pendingWithdrawals.length > 0 && (
                <span className="admin-badge">{pendingWithdrawals.length}</span>
              )}
              {item.to === '/support' && unreadSupportCases.length > 0 && (
                <span className="admin-badge">{unreadSupportCases.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <a href={USER_APP_URL} className="admin-nav-link admin-nav-link--muted" target="_blank" rel="noreferrer">
            ← Customer Site
          </a>
          <button type="button" className="admin-nav-link admin-nav-link--logout" onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <div>
            <h1 className="admin-topbar-title">Control Center</h1>
            <p className="admin-topbar-sub">
              {loading ? 'Loading live data…' : (
                <>
                  {users.length} users · {pendingDeposits.length} pending deposits · {pendingWithdrawals.length} pending withdrawals · {unreadSupportCases.length} new support
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={refresh}
            disabled={refreshing || loading}
            title="Refresh data"
          >
            {refreshing || loading ? 'Syncing…' : 'Refresh'}
          </button>
          <NavLink to="/notifications" className="admin-notif-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {totalPending > 0 && <span className="admin-notif-dot">{totalPending}</span>}
          </NavLink>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
