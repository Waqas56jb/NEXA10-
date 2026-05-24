import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setUserToken } from '../lib/api';
import { useAppData } from '../context/AppDataContext';

const items = [
  { to: '/dashboard', route: 'home', label: 'Home', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
    </svg>
  )},
  { to: '/deposit', route: 'deposit', label: 'Deposit', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" />
    </svg>
  )},
  { to: '/invest', route: 'invest', label: 'Invest', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" />
    </svg>
  )},
  { to: '/transactions', route: 'logs', label: 'Logs', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" />
    </svg>
  )},
];

const menuItems = [
  {
    to: '/withdraw',
    label: 'Withdraw',
    desc: 'Cash out to your bank',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M12 18v-4M10 16l2 2 2-2" />
      </svg>
    ),
  },
  {
    to: '/referrals',
    label: 'Referrals',
    desc: 'Invite friends & earn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/levels',
    label: 'Levels',
    desc: 'Rank & tier benefits',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'News',
    desc: 'Platform updates',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22V4a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M17 2v5h5" /><path d="M8 13h8M8 17h6M8 9h3" />
      </svg>
    ),
  },
  {
    to: '/support',
    label: 'Support',
    desc: 'Chat with our team',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    highlight: true,
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  const signOut = () => {
    setUserToken(null);
    close();
    navigate('/login');
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Primary">
        {items.map(({ to, route, label, icon }) => (
          <Link
            key={route}
            to={to}
            className={`bn-item${pathname === to || (route === 'home' && pathname === '/dashboard') ? ' active' : ''}`}
            data-route={route}
          >
            <span className="bn-icon-wrap">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
        <button
          className={`bn-item${open ? ' active' : ''}`}
          data-route="menu"
          type="button"
          onClick={() => setOpen(true)}
        >
          <span className="bn-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </span>
          <span>Menu</span>
        </button>
      </nav>

      {open && (
        <div className="bn-sheet" role="dialog" aria-modal="true" onClick={close}>
          <div className="bn-sheet-inner" onClick={(e) => e.stopPropagation()}>
            <div className="bn-sheet-handle" aria-hidden="true" />

            <div className="bn-sheet-head">
              <div className="bn-sheet-avatar" aria-hidden="true">
                {(currentUser?.username || currentUser?.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="bn-sheet-user">
                <strong>{currentUser?.username || 'Guest'}</strong>
                <span>{currentUser?.email || '—'}</span>
              </div>
              <button type="button" className="bn-sheet-close" onClick={close} aria-label="Close">×</button>
            </div>

            <ul className="bn-sheet-list">
              {menuItems.map((m) => (
                <li key={m.to}>
                  <Link to={m.to} className={`bn-sheet-link${m.highlight ? ' bn-sheet-link--featured' : ''}`} onClick={close}>
                    <span className="bn-sheet-link-icon">{m.icon}</span>
                    <span className="bn-sheet-link-text">
                      <strong>{m.label}</strong>
                      <span>{m.desc}</span>
                    </span>
                    <span className="bn-sheet-link-arrow" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>

            <button type="button" className="bn-sheet-logout" onClick={signOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
