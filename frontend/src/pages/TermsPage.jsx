import { Link } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import '../styles/pages/terms.css';

const SECTIONS = [
  {
    title: 'Professional Services',
    body: 'Nexa10.com provides digital services and online solutions designed to offer users a smooth and professional experience.',
  },
  {
    title: 'Account Responsibility',
    body: 'Users are responsible for maintaining the confidentiality of their account information and login details.',
  },
  {
    title: 'Accurate Information',
    body: 'Users must provide correct and updated information while using our services.',
  },
  {
    title: 'Secure Platform',
    body: 'We continuously improve our systems and security to keep the platform safe and stable for all users.',
  },
  {
    title: 'Payments & Transactions',
    body: 'All payments must be made through approved methods. Transaction processing times may vary depending on payment providers.',
  },
  {
    title: 'Fair Refund Policy',
    body: 'Refund requests are reviewed according to the type of service purchased and platform policies.',
  },
  {
    title: 'Fair Usage Policy',
    body: 'Users agree not to misuse the platform, create fake activity, abuse services, or violate any applicable laws.',
  },
  {
    title: 'Service Improvements',
    body: 'Nexa10.com may update, improve, or modify services and features at any time to enhance user experience.',
  },
  {
    title: 'Third-Party Providers',
    body: 'Some services may involve trusted third-party providers such as payment gateways, hosting providers, or technical partners.',
  },
  {
    title: 'Privacy & Security',
    body: 'User information is handled responsibly and used only for security, support, verification, and service-related purposes.',
  },
  {
    title: 'Risk Management',
    body: 'Users understand that online markets and digital systems may sometimes experience fluctuations, delays, or unexpected conditions. Nexa10.com will not be held responsible for losses caused by market changes, market crashes, third-party failures, or circumstances beyond our control.',
  },
  {
    title: 'Service Availability',
    body: 'Temporary interruptions may occur due to maintenance, updates, or technical improvements.',
  },
  {
    title: 'Policy Updates',
    body: 'Nexa10.com reserves the right to update or modify these Terms & Conditions whenever necessary.',
  },
  {
    title: 'Customer Support',
    body: 'Our support team is available to assist users with service-related questions and technical concerns.',
  },
  {
    title: 'Acceptance of Terms',
    body: 'By continuing to use Nexa10.com, you confirm that you have read, understood, and agreed to these Terms & Conditions.',
  },
];

export default function TermsPage() {
  return (
    <>
      <Particles connectLines count={60} />
      <BgGrid orbs />

      <header className="terms-top">
        <Link to="/" className="terms-back" aria-label="Back to NEXA10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Back to NEXA10</span>
        </Link>
        <Link to="/" className="terms-logo">
          <img src="/logo.png" alt="NEXA10" />
        </Link>
      </header>

      <main className="terms-main">
        <section className="terms-hero">
          <span className="terms-tag">Legal · v1</span>
          <h1>Terms &amp; <span>Conditions</span></h1>
          <p>
            Welcome to <strong>Nexa10.com</strong>. We are committed to providing a professional,
            secure, and reliable experience for all users. By accessing or using our platform,
            you agree to the following Terms &amp; Conditions.
          </p>
          <div className="terms-meta">
            <span>Last updated: 25 May 2026</span>
            <span aria-hidden="true">·</span>
            <a href="https://www.nexa10.com" target="_blank" rel="noreferrer">nexa10.com</a>
          </div>
        </section>

        <section className="terms-list" aria-label="Terms and conditions sections">
          {SECTIONS.map((s, i) => (
            <article key={s.title} className="terms-item">
              <span className="terms-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="terms-text">
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="terms-footer">
          <p>
            If you have any questions about these Terms, contact our support team via the
            in-app <Link to="/support">Support</Link> page.
          </p>
          <div className="terms-actions">
            <Link to="/signup" className="terms-btn terms-btn--primary">I Agree — Continue</Link>
            <Link to="/" className="terms-btn">Back to Home</Link>
          </div>
        </section>
      </main>
    </>
  );
}
