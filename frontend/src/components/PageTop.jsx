import { Link } from 'react-router-dom';

export default function PageTop({ backTo = '/dashboard', title, icon, centerTitle = false, extra = null }) {
  return (
    <header className={`page-top${centerTitle ? ' page-top--center' : ''}`}>
      <Link to={backTo} className="back-btn" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className="page-title-wrap">
        {icon && <span className="page-title-icon" aria-hidden="true">{icon}</span>}
        <h1 className="page-title">{title}</h1>
      </div>
      {extra ?? <span className="page-top-spacer" aria-hidden="true" />}
    </header>
  );
}
