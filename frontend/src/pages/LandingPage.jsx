import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Particles from '../components/Particles';
import AuthOverlay from '../components/AuthOverlay';
import '../styles/pages/landing.css';

const TICKERS = [
  { sym: 'BTC/USD', price: '$67,420', chg: '+2.4%', up: true },
  { sym: 'ETH/USD', price: '$3,180', chg: '+1.8%', up: true },
  { sym: 'EUR/USD', price: '1.0845', chg: '-0.3%', up: false },
  { sym: 'GBP/USD', price: '1.2710', chg: '+0.5%', up: true },
  { sym: 'GOLD', price: '$2,318', chg: '+0.9%', up: true },
  { sym: 'S&P500', price: '5,248', chg: '+0.7%', up: true },
];

const FEATURES = [
  { icon: '🤖', title: 'AI-Driven Execution', text: 'Our models analyze 200+ market indicators in real time. Trades are placed and managed by NEXA10 — not by you at home on a trading screen.' },
  { icon: '⚡', title: 'Institutional Speed', text: 'Orders are executed in milliseconds by our infrastructure, 24/7 — so your capital is deployed when the model acts.' },
  { icon: '📊', title: 'Your Investor Dashboard', text: 'See balance, performance, and allocation in one place — transparency without asking you to trade.' },
  { icon: '🔒', title: 'Capital Protection', text: 'Automated stop-loss, take-profit, and position sizing applied across our book.' },
  { icon: '📱', title: 'Investor App', text: 'Check your portfolio, statements, and alerts on iOS and Android.' },
  { icon: '💬', title: 'Support & Updates', text: 'Get answers on your account and performance summaries — available 24/7.' },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((r) => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.querySelector('header');
      if (h) h.classList.toggle('header--compact', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Particles count={80} connectLines />
      <AuthOverlay />

      <div className={`mobile-nav${navOpen ? ' open' : ''}`} id="mobileNav">
        <span className="mobile-nav-close" onClick={() => setNavOpen(false)} role="button" tabIndex={0}>✕</span>
        <a href="#features" onClick={() => setNavOpen(false)}>Features</a>
        <a href="#how" onClick={() => setNavOpen(false)}>How It Works</a>
        <a href="#plans" onClick={() => setNavOpen(false)}>Plans</a>
        <Link to="/login" onClick={() => setNavOpen(false)}>Sign In</Link>
        <Link to="/signup" onClick={() => setNavOpen(false)}>Start Free</Link>
      </div>

      <header>
        <div className="logo-wrap">
          <img className="logo-img" src="/logo.png" alt="NEXA10" width="220" height="44" decoding="async" />
        </div>
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#plans">Plans</a>
          <a href="#testimonials">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-btns">
          <Link to="/login" className="btn-ghost">Sign In</Link>
          <Link to="/signup" className="btn-primary">Start Free →</Link>
        </div>
        <div className="hamburger" onClick={() => setNavOpen(true)} role="button" tabIndex={0}>
          <span /><span /><span />
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg" /><div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge"><span className="badge-dot" /> LIVE — AI SIGNALS ACTIVE</div>
          <h1>Trade <span>Smarter</span><br />Grow <span>Faster</span><br />With <span>AI Power</span></h1>
          <p>NEXA10 delivers real-time AI-powered trading signals, automated strategies, and deep market intelligence — so you can profit with precision, not guesswork.</p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-big btn-big-primary">🚀 Start Trading Now</Link>
            <a href="#how" className="btn-big btn-big-outline">▶ Watch Demo</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><div className="stat-num">12K+</div><div className="stat-label">Active Traders</div></div>
            <div className="stat"><div className="stat-num">94%</div><div className="stat-label">Signal Accuracy</div></div>
            <div className="stat"><div className="stat-num">$8M+</div><div className="stat-label">Profits Generated</div></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-ring" /><div className="hero-visual-ring2" />
          <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=80" alt="AI Trading Dashboard" />
        </div>
      </section>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <div key={i} className="ticker-item">
              <span className="ticker-sym">{t.sym}</span>
              <span className="ticker-price">{t.price}</span>
              <span className={t.up ? 'ticker-up' : 'ticker-down'}>{t.chg}</span>
              <span className="ticker-sep" />
            </div>
          ))}
        </div>
      </div>

      <section className="features-bg section-block" id="features">
        <div className="section-tag reveal">Why NEXA10</div>
        <div className="section-title reveal">We Handle the Markets.<br /><span>You Focus on Life.</span></div>
        <p className="section-sub reveal">NEXA10 runs professional, AI-assisted trading using pooled investor capital. You fund your account — our systems execute, manage risk, and report performance.</p>
        <div className="features-grid" style={{ marginTop: 60 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card reveal">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-bg" id="how">
        <div className="section-tag section-center reveal">Process</div>
        <div className="section-title section-center reveal">How <span>NEXA10</span> Works</div>
        <div className="steps-grid">
          {['Open & Fund', 'We Allocate', 'AI & Team Trade', 'Earn & Withdraw'].map((title, i) => (
            <div key={title} className="step reveal">
              <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{title}</h3>
              <p>Step {i + 1} of your managed investment journey with NEXA10.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="plans">
        <div className="section-tag section-center reveal">Pricing</div>
        <div className="section-title section-center reveal">Choose Your <span>Investment Plan</span></div>
        <div className="plans-grid reveal">
          <div className="plan-card">
            <div className="plan-name">Starter</div>
            <div className="plan-price">$0 <span>/ month</span></div>
            <Link to="/signup" className="btn-plan btn-plan-outline">Start With Starter</Link>
          </div>
          <div className="plan-card popular">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-name">Pro Investor</div>
            <div className="plan-price grad">$49 <span>/ month</span></div>
            <Link to="/signup" className="btn-plan btn-plan-full">Become Pro Investor →</Link>
          </div>
          <div className="plan-card">
            <div className="plan-name">Elite</div>
            <div className="plan-price">$129 <span>/ month</span></div>
            <Link to="/signup" className="btn-plan btn-plan-outline">Apply for Elite</Link>
          </div>
        </div>
      </section>

      <section className="testi-bg" id="testimonials">
        <div className="section-title section-center reveal">What Our <span>Investors Say</span></div>
        <div className="testi-grid reveal">
          <div className="testi-card">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text">"I don't have time to trade. NEXA10's managed program handles everything."</p>
            <div className="testi-author"><div className="testi-avatar">AK</div><div><div className="testi-name">Ahmed Khan</div><div className="testi-role">Investor, Lahore</div></div></div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="contact">
        <h2 className="reveal">Ready to <span>Invest & Let Us Trade</span> for You?</h2>
        <div className="cta-btns reveal">
          <Link to="/signup" className="btn-big btn-big-primary">🚀 Open Investment Account</Link>
          <a href="#features" className="btn-big btn-big-outline">Why NEXA10</a>
        </div>
      </section>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <img className="footer-logo" src="/logo.png" alt="NEXA10" width="200" height="36" />
            <p>Managed AI trading for investors who want professional execution — not DIY charts.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/signup">Open Account</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 <span className="brand-glow">NEXA10.com</span> — All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
