import { Link, useLocation } from 'react-router-dom';

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

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map(({ to, route, label, icon }) => (
        <Link key={route} to={to} className={`bn-item${pathname === to || (route === 'home' && pathname === '/dashboard') ? ' active' : ''}`} data-route={route}>
          <span className="bn-icon-wrap">{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
      <button className="bn-item" data-route="menu" type="button">
        <span className="bn-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </span>
        <span>Menu</span>
      </button>
    </nav>
  );
}
