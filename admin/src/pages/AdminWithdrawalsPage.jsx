import { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { formatTimeAgo } from '../lib/api';

function fmtMoney(n) {
  return Number(n || 0).toFixed(2);
}

export default function AdminWithdrawalsPage() {
  const { withdrawals = [], users, loading, error, actions } = useAdminData();
  const [filter, setFilter] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveNote, setApproveNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const filtered = withdrawals.filter((w) => filter === 'all' || w.status === filter);
  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;

  const userById = (id) => users.find((u) => u.id === id);

  const openApprove = (w) => {
    setApproveTarget(w);
    setApproveNote('');
    setMsg('');
  };
  const openReject = (w) => {
    setRejectTarget(w);
    setRejectNote('');
    setMsg('');
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setBusy(true);
    setMsg('');
    try {
      await actions.approveWithdrawal(approveTarget.id, approveNote.trim() || null);
      setApproveTarget(null);
    } catch (err) {
      setMsg(err.message || 'Approval failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusy(true);
    setMsg('');
    try {
      await actions.rejectWithdrawal(rejectTarget.id, rejectNote.trim() || null);
      setRejectTarget(null);
    } catch (err) {
      setMsg(err.message || 'Rejection failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-page"><p className="admin-muted">Loading withdrawals…</p></div>;
  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Withdrawal Requests</h2>
      <p className="admin-page-desc">
        Customer balance is deducted at request time. Approving marks the payout as sent. Rejecting refunds the balance automatically.
      </p>

      <div className="admin-tabs">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-panel admin-empty-state">
          No {filter === 'all' ? '' : filter} withdrawal requests
        </div>
      ) : (
        <div className="admin-deposits-grid">
          {filtered.map((w) => {
            const u = userById(w.userId);
            return (
              <article key={w.id} className={`admin-deposit-card admin-deposit-card--${w.status}`}>
                <div className="admin-deposit-head">
                  <span className={`admin-status admin-status--${w.status}`}>{w.status}</span>
                  <span className="admin-muted">{formatTimeAgo(w.createdAt)}</span>
                </div>

                <div className="admin-deposit-body">
                  <p><strong>{w.userUsername}</strong></p>
                  <p className="admin-muted">{w.userEmail}</p>
                  <p className="admin-amount" style={{ marginTop: 8 }}>
                    Amount: <strong>${fmtMoney(w.amount)}</strong>
                  </p>
                  {u && (
                    <p className="admin-muted">
                      Remaining balance after debit:{' '}
                      <strong style={{ color: '#00d4ff' }}>${fmtMoney(u.balance)}</strong>
                    </p>
                  )}
                </div>

                <div className="admin-bank-box">
                  <div><span>Account holder</span><strong>{w.accountHolderName}</strong></div>
                  <div><span>Account number</span><strong className="admin-acct-num">{w.accountNumber}</strong></div>
                  {w.bankName && <div><span>Bank</span><strong>{w.bankName}</strong></div>}
                </div>

                {w.adminNote && (
                  <p className="admin-muted" style={{ marginTop: 6, fontStyle: 'italic' }}>
                    Admin note: {w.adminNote}
                  </p>
                )}

                {w.status === 'pending' && (
                  <div className="admin-deposit-actions">
                    <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy} onClick={() => openApprove(w)}>
                      Approve & Mark Sent
                    </button>
                    <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" disabled={busy} onClick={() => openReject(w)}>
                      Reject & Refund
                    </button>
                  </div>
                )}
                {w.status !== 'pending' && w.reviewedAt && (
                  <p className="admin-muted" style={{ marginTop: 6 }}>
                    Reviewed {formatTimeAgo(w.reviewedAt)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {approveTarget && (
        <div className="admin-modal" onClick={() => setApproveTarget(null)} role="presentation">
          <div className="admin-modal-inner admin-approve-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Payout Sent</h3>
            <p className="admin-muted">
              <strong>{approveTarget.userUsername}</strong> · {approveTarget.userEmail}
            </p>
            <p className="admin-amount" style={{ marginTop: 6 }}>
              ${fmtMoney(approveTarget.amount)} → {approveTarget.accountHolderName} · {approveTarget.accountNumber}
              {approveTarget.bankName ? ` (${approveTarget.bankName})` : ''}
            </p>
            <p className="admin-muted" style={{ marginTop: 8 }}>
              The customer's balance was already deducted when they requested this. Approving only marks it as sent.
            </p>
            <label className="admin-field">
              <span>Reference / note (optional)</span>
              <input
                type="text"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="e.g. TXN-2026-04812"
              />
            </label>
            {msg && <p className="admin-error">{msg}</p>}
            <div className="admin-deposit-actions">
              <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy} onClick={confirmApprove}>
                {busy ? 'Approving…' : 'Confirm Approval'}
              </button>
              <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setApproveTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="admin-modal" onClick={() => setRejectTarget(null)} role="presentation">
          <div className="admin-modal-inner admin-approve-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Withdrawal</h3>
            <p className="admin-muted">
              <strong>{rejectTarget.userUsername}</strong> · {rejectTarget.userEmail}
            </p>
            <p className="admin-amount" style={{ marginTop: 6 }}>
              ${fmtMoney(rejectTarget.amount)} will be refunded to the user's balance immediately.
            </p>
            <label className="admin-field">
              <span>Reason (shown to user)</span>
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Account details mismatch"
              />
            </label>
            {msg && <p className="admin-error">{msg}</p>}
            <div className="admin-deposit-actions">
              <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" disabled={busy} onClick={confirmReject}>
                {busy ? 'Rejecting…' : 'Reject & Refund Balance'}
              </button>
              <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
