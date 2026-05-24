import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import BottomNav from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { getUserToken, isApiEnabled, userApi } from '../lib/api';
import '../styles/pages/withdraw.css';

const MIN = 1;
const TURNAROUND_HOURS = 24;

function fmtMoney(n) {
  return Number(n || 0).toFixed(2);
}
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}
function maskAcct(s) {
  if (!s) return '—';
  const str = String(s);
  if (str.length <= 4) return str;
  return `••• ${str.slice(-4)}`;
}

export default function WithdrawPage() {
  const { currentUser, withdrawals = [], refresh, loading, apiMode } = useAppData();
  const balance = currentUser?.balance || 0;

  const [amount, setAmount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [confirmEmail, setConfirmEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const englishInput = {
    lang: 'en',
    spellCheck: false,
    autoCorrect: 'off',
    autoCapitalize: 'none',
    autoComplete: 'off',
  };

  const numericProps = { type: 'text', inputMode: 'decimal', ...englishInput };
  const acctNumProps = { type: 'text', inputMode: 'numeric', ...englishInput };

  const amt = parseFloat(amount);
  const validAmount = Number.isFinite(amt) && amt >= MIN && amt <= balance;
  const ready =
    validAmount &&
    accountHolder.trim().length >= 2 &&
    accountNumber.trim().length >= 4 &&
    confirmEmail;

  const submit = async () => {
    setErr('');
    setOk('');
    if (!Number.isFinite(amt) || amt < MIN) return setErr(`Minimum withdrawal is $${MIN}`);
    if (amt > balance) return setErr('Amount exceeds available balance');
    if (accountHolder.trim().length < 2) return setErr('Enter the account holder name');
    if (accountNumber.trim().length < 4) return setErr('Enter a valid account number');

    setBusy(true);
    try {
      await userApi.submitWithdrawal({
        amount: amt,
        account_holder_name: accountHolder.trim(),
        account_number: accountNumber.trim(),
        bank_name: bankName.trim() || undefined,
      });
      setOk(
        `Request submitted. Balance deducted now; you'll receive the funds in your account within ${TURNAROUND_HOURS} hours after admin approval.`,
      );
      setAmount('');
      setAccountHolder('');
      setAccountNumber('');
      setBankName('');
      await refresh();
    } catch (e) {
      setErr(e.message || 'Withdrawal failed');
    } finally {
      setBusy(false);
    }
  };

  const sorted = useMemo(
    () => [...withdrawals].sort((a, b) => b.createdAt - a.createdAt),
    [withdrawals],
  );

  if (apiMode && !loading && !getUserToken()) return <Navigate to="/login" replace />;

  return (
    <>
      <Particles connectLines count={60} />
      <BgGrid orbs />
      <PageTop
        title="Withdraw"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M12 18v-4M10 16l2 2 2-2" />
          </svg>
        }
      />
      <main className="wd-main">
        {currentUser?.blocked && (
          <section className="wd-card wd-card--alert">
            Your account is blocked. Contact support to enable withdrawals.
          </section>
        )}

        {/* ── Available balance ── */}
        <section className="wd-balance-card">
          <div className="wd-balance-head">
            <span className="wd-live-dot" aria-hidden="true" />
            <span className="wd-balance-label">Available balance</span>
          </div>
          <div className="wd-balance-amount">
            <span className="wd-currency">$</span>
            <span>{fmtMoney(balance)}</span>
          </div>
          <p className="wd-balance-note">
            Funds are deducted immediately on submit and credited to your bank within {TURNAROUND_HOURS} hours after admin approval.
          </p>
        </section>

        {/* ── Form ── */}
        <section className="wd-card">
          <h2 className="wd-card-title">Withdrawal Request</h2>

          <div className="wd-amount-row">
            <label className="wd-label" htmlFor="wd-amt">Amount (USD)</label>
            <div className="wd-amount-wrap">
              <span className="wd-amount-prefix">$</span>
              <input
                id="wd-amt"
                className="wd-amount-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = v.split('.');
                  setAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : v);
                  setErr('');
                  setOk('');
                }}
                {...numericProps}
              />
              <button
                type="button"
                className="wd-max-btn"
                onClick={() => setAmount(balance > 0 ? String(balance.toFixed(2)) : '')}
                disabled={balance <= 0}
              >
                MAX
              </button>
            </div>
            <div className="wd-quick-row">
              {[10, 25, 50, 100].map((v) => (
                <button
                  type="button"
                  key={v}
                  className="wd-quick"
                  disabled={v > balance}
                  onClick={() => { setAmount(String(v)); setErr(''); setOk(''); }}
                >
                  ${v}
                </button>
              ))}
            </div>
            <div className="wd-meta-row">
              <span>Min ${MIN}</span>
              <span>You'll receive within {TURNAROUND_HOURS}h after approval</span>
            </div>
          </div>

          <div className="wd-field">
            <label className="wd-label" htmlFor="wd-holder">Account Holder Name</label>
            <input
              id="wd-holder"
              className="wd-input"
              placeholder="Full name on bank account"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              type="text"
              {...englishInput}
              autoCapitalize="words"
            />
          </div>

          <div className="wd-field">
            <label className="wd-label" htmlFor="wd-acct">Account Number / IBAN</label>
            <input
              id="wd-acct"
              className="wd-input"
              placeholder="e.g. 1234567890123"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
              {...acctNumProps}
            />
          </div>

          <div className="wd-field">
            <label className="wd-label" htmlFor="wd-bank">Bank Name <span className="wd-optional">(optional)</span></label>
            <input
              id="wd-bank"
              className="wd-input"
              placeholder="e.g. HBL, Meezan, Chase"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              type="text"
              {...englishInput}
              autoCapitalize="words"
            />
          </div>

          <div className="wd-summary">
            <div><span>Registered name</span><strong>{currentUser?.username || '—'}</strong></div>
            <div><span>Registered email</span><strong>{currentUser?.email || '—'}</strong></div>
          </div>

          <label className="wd-checkbox">
            <input
              type="checkbox"
              checked={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.checked)}
            />
            <span>
              I confirm the bank details above are correct and registered under <strong>{currentUser?.username || 'me'}</strong>.
              Funds sent to the wrong account cannot be recovered.
            </span>
          </label>

          {err && <p className="wd-err">{err}</p>}
          {ok && <p className="wd-ok">{ok}</p>}

          <button
            type="button"
            className="wd-submit"
            onClick={submit}
            disabled={!ready || busy || currentUser?.blocked}
          >
            {busy ? 'Submitting…' : `Request Withdrawal${amt > 0 ? ` · $${fmtMoney(amt)}` : ''}`}
          </button>
        </section>

        {/* ── History ── */}
        <section className="wd-card">
          <h2 className="wd-card-title">Recent Requests</h2>
          {sorted.length === 0 ? (
            <p className="wd-empty">No withdrawal requests yet.</p>
          ) : (
            <ul className="wd-history">
              {sorted.slice(0, 10).map((w) => (
                <li key={w.id} className={`wd-row wd-row--${w.status}`}>
                  <div className="wd-row-main">
                    <div className="wd-row-amount">${fmtMoney(w.amount)}</div>
                    <div className="wd-row-meta">
                      <span>{maskAcct(w.accountNumber)}</span>
                      <span>·</span>
                      <span>{w.accountHolderName}</span>
                    </div>
                    <div className="wd-row-time">{fmtDate(w.createdAt)}</div>
                  </div>
                  <div className="wd-row-status">
                    <span className={`wd-pill wd-pill--${w.status}`}>{w.status}</span>
                    {w.adminNote && <span className="wd-note">{w.adminNote}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
