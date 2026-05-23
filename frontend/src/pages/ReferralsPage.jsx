import { useState } from 'react';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/referrals.css';

const REF_LINK = 'https://nexa10.com/register?ref=81ibdsh3zc';

const stats = {
  total: [{ v: '0', l: 'Total' }, { v: '$0', l: 'Total Com.' }, { v: '$0', l: 'Total Invest.' }],
  direct: [{ v: '0', l: 'Direct' }, { v: '$0', l: 'Direct Com.' }, { v: '$0', l: 'Direct Invest.' }],
  indirect: [{ v: '0', l: 'Indirect' }, { v: '$0', l: 'Indirect Com.' }, { v: '$0', l: 'Indirect Invest.' }],
};

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(REF_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Particles /><BgGrid />
      <PageTop title="Referrals" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />
      <main className="ref-main">
        <div className="ref-panel">
          <div className="panel-head"><div className="panel-head-text"><h2>Referral Statistics</h2><p>Your network performance</p></div></div>
          <div className="stats-grid">
            {Object.entries(stats).map(([key, cols]) => (
              <div key={key} className={`stat-col stat-col--${key === 'total' ? 'total' : key}`}>
                {cols.map((s) => (<div key={s.l} className="stat-card"><span className="stat-value">{s.v}</span><span className="stat-label">{s.l}</span></div>))}
              </div>
            ))}
          </div>
          <div className="ref-link-banner">
            <p>Share your link<code>{REF_LINK}</code></p>
            <button type="button" className="btn-copy" onClick={copy}>{copied ? 'Copied!' : 'Copy Link'}</button>
          </div>
        </div>
      </main>
    </>
  );
}
