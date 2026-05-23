import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/levels.css';

const levels = ['5%', '4%', '3%', '2%', '1%'];

function LevelGrid() {
  return (
    <div className="levels-grid">
      {levels.map((pct, i) => (
        <div key={i} className="level-row">
          <div className="level-left"><span className="level-num">{i + 1}</span><span className="level-tag">L{i + 1}</span></div>
          <span className="level-pct">{pct}</span>
        </div>
      ))}
    </div>
  );
}

export default function LevelsPage() {
  return (
    <>
      <Particles /><BgGrid />
      <PageTop backTo="/dashboard" title="Referral Plans" centerTitle icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /></svg>} />
      <main className="levels-main">
        <section className="hero-banner">
          <div className="hero-star">★</div>
          <h2>Earn More, Achieve More!</h2>
          <p>Build your network and unlock amazing rewards through our referral program.</p>
        </section>
        <section className="plan-card plan-card--invest">
          <div className="plan-head"><div className="plan-head-text"><h3>Referral Invest Commissions</h3><p>Earn when your referrals make investments.</p></div></div>
          <LevelGrid />
          <p className="plan-foot">Commissions are earned automatically on every qualifying transaction!</p>
        </section>
        <section className="plan-card plan-card--earn">
          <div className="plan-head"><div className="plan-head-text"><h3>Referral Earn Commissions</h3><p>Earn from your referrals' investment earnings.</p></div></div>
          <LevelGrid />
          <p className="plan-foot">Commissions are earned automatically on every qualifying transaction!</p>
        </section>
      </main>
    </>
  );
}
