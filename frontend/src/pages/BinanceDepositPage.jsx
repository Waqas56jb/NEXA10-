import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import '../styles/pages/binance-deposit.css';

const BINANCE_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg';

const NETWORKS = [
  {
    id: 'trc20',
    label: 'TRC20',
    title: 'Tron (TRC20)',
    network: 'Tron (TRC20)',
    address: 'TUMBg6mzVm2JNkxNRCpdRRXBtkTuuJz5yL',
    qrImage: '/TRC20.jpeg',
    accent: 'cyan',
  },
  {
    id: 'bep20',
    label: 'BEP20',
    title: 'BNB Smart Chain',
    network: 'BNB Smart Chain (BEP20)',
    address: '0xca468dfd3f61c158ec6c217a2c3c30c673c1f7f7',
    qrImage: '/BNB Block chain.jpeg',
    accent: 'gold',
  },
];

function NetworkCard({ network, onCopy, onShare, copiedId }) {
  return (
    <article className={`network-card network-card--${network.accent}`}>
      <div className="network-card-glow" aria-hidden="true" />
      <div className="network-card-head">
        <span className="network-badge">{network.label}</span>
        <h2>Deposit USDT</h2>
        <p className="network-sub">{network.title}</p>
      </div>
      <div className="qr-frame">
        <img src={network.qrImage} alt={`${network.label} USDT deposit QR code`} className="qr-image" loading="lazy" />
      </div>
      <div className="detail-stack">
        <div className="detail-row">
          <span className="detail-label">Network</span>
          <span className="detail-value">{network.network}</span>
        </div>
        <div className="detail-row detail-row--address">
          <span className="detail-label">Address</span>
          <code className="detail-value detail-value--mono">{network.address}</code>
        </div>
      </div>
      <div className="address-actions">
        <button
          type="button"
          className="addr-btn addr-btn--copy"
          onClick={() => onCopy(network.id, network.address)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedId === network.id ? 'Copied!' : 'Copy Address'}
        </button>
        <button type="button" className="addr-btn addr-btn--share" onClick={() => onShare(network)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          Share Address
        </button>
      </div>
      <div className="binance-brand">
        <img src={BINANCE_LOGO} alt="Binance" width={22} height={22} />
        <span>Binance</span>
      </div>
    </article>
  );
}

export default function BinanceDepositPage() {
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({ network: 'trc20', email: '', username: '', amount: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  const copyAddress = async (id, address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Could not copy. Please copy manually.');
    }
  };

  const shareAddress = async (network) => {
    const text = `USDT Deposit (${network.network})\nAddress: ${network.address}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NEXA10 Binance Deposit', text });
        return;
      } catch { /* fall through */ }
    }
    await copyAddress(network.id, network.address);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.amount) {
      alert('Please fill in email, username, and transfer amount.');
      return;
    }
    if (!screenshot) {
      alert('Please upload your payment screenshot.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <>
      <Particles />
      <BgGrid />
      <PageTop
        backTo="/deposit"
        title="Binance Deposit"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
          </svg>
        }
      />
      <main className="binance-main">
        <div className="binance-intro">
          <img src={BINANCE_LOGO} alt="" className="binance-intro-logo" width={36} height={36} />
          <div>
            <h1>Deposit USDT via Binance</h1>
            <p>Scan the QR code or copy the address for your preferred network. Only send USDT on the matching chain.</p>
          </div>
        </div>

        <div className="networks-grid">
          {NETWORKS.map((n) => (
            <NetworkCard key={n.id} network={n} onCopy={copyAddress} onShare={shareAddress} copiedId={copiedId} />
          ))}
        </div>

        <section className="submit-panel">
          <div className="submit-panel-glow" aria-hidden="true" />
          <div className="submit-head">
            <h2>Submit Payment Proof</h2>
            <p>Upload your transfer screenshot and details so we can verify your deposit.</p>
          </div>

          {submitted ? (
            <div className="submit-success">
              <div className="success-icon">✓</div>
              <h3>Payment Submitted</h3>
              <p>Your deposit proof has been received. Our team will verify and credit your account shortly.</p>
              <Link to="/dashboard" className="btn-back-dash">Back to Dashboard</Link>
            </div>
          ) : (
            <form className="submit-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="network">Network Used</label>
                <select
                  id="network"
                  value={form.network}
                  onChange={(e) => setForm({ ...form, network: e.target.value })}
                >
                  <option value="trc20">Tron (TRC20)</option>
                  <option value="bep20">BNB Smart Chain (BEP20)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Your NEXA10 username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="amount">Amount Transferred (USDT)</label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 100"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Payment Screenshot</label>
                <input ref={fileRef} type="file" accept="image/*" className="file-input-hidden" onChange={onFileChange} />
                <button type="button" className="upload-zone" onClick={() => fileRef.current?.click()}>
                  {preview ? (
                    <img src={preview} alt="Payment proof preview" className="upload-preview" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Tap to upload screenshot</span>
                      <span className="upload-hint">PNG, JPG up to 10MB</span>
                    </>
                  )}
                </button>
                {screenshot && <p className="file-name">{screenshot.name}</p>}
              </div>

              <button type="submit" className="btn-submit-payment">Submit Payment →</button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
