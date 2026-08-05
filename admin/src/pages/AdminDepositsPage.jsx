import { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { formatTimeAgo } from '../lib/api';

export default function AdminDepositsPage() {
  const { deposits, loading, error, actions } = useAdminData();
  const [filter, setFilter] = useState('pending');
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState('idle');
  const [approveTarget, setApproveTarget] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const filtered = deposits.filter((d) => filter === 'all' || d.status === filter);

  const openScreenshot = async (deposit) => {
    if (deposit.screenshot) {
      setPreview(deposit.screenshot);
      setPreviewState('ready');
      return;
    }
    setPreview(null);
    setPreviewState('loading');
    try {
      const image = await actions.getDepositScreenshot(deposit.id);
      setPreview(image);
      setPreviewState(image ? 'ready' : 'empty');
    } catch {
      setPreviewState('error');
    }
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewState('idle');
  };

  const openApprove = (deposit) => {
    setApproveTarget(deposit);
    setReceivedAmount(String(deposit.amount));
    setMsg('');
  };

  const confirmApprove = async () => {
    const amt = parseFloat(receivedAmount);
    if (!amt || amt <= 0) {
      setMsg('Enter a valid received amount');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await actions.approveDeposit(approveTarget.id, amt);
      setApproveTarget(null);
    } catch (err) {
      setMsg(err.message || 'Approval failed');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (id) => {
    setBusy(true);
    try {
      await actions.rejectDeposit(id);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-page"><p className="admin-muted">Loading deposits...</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Deposit Requests</h2>
      <p className="admin-page-desc">Review payment proofs, enter received USDT amount, and credit the user balance.</p>
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-tabs">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} type="button" className={`admin-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && ` (${deposits.filter((d) => d.status === 'pending').length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-panel admin-empty-state">No {filter === 'all' ? '' : filter} deposits</div>
      ) : (
        <div className="admin-deposits-grid">
          {filtered.map((d) => (
            <article key={d.id} className={`admin-deposit-card admin-deposit-card--${d.status}`}>
              <div className="admin-deposit-head">
                <span className={`admin-status admin-status--${d.status}`}>{d.status}</span>
                <span className="admin-muted">{formatTimeAgo(d.createdAt)}</span>
              </div>
              <div className="admin-deposit-body">
                <p><strong>{d.username}</strong> · {d.email}</p>
                <p className="admin-amount">Claimed: ${d.amount} USDT</p>
                {d.status === 'approved' && d.approvedAmount != null && (
                  <p className="admin-amount" style={{ color: '#00ff88' }}>Received: ${d.approvedAmount} USDT</p>
                )}
                <p className="admin-muted">{d.exchange?.toUpperCase()} · {d.network}</p>
              </div>
              {d.hasScreenshot && (
                <button type="button" className="admin-screenshot-btn admin-screenshot-btn--link" onClick={() => openScreenshot(d)}>
                  <span>View screenshot</span>
                </button>
              )}
              {d.status === 'pending' && (
                <div className="admin-deposit-actions">
                  <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy} onClick={() => openApprove(d)}>Approve & Credit</button>
                  <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" disabled={busy} onClick={() => reject(d.id)}>Reject</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {previewState !== 'idle' && (
        <div className="admin-modal" onClick={closePreview} role="presentation">
          <div className="admin-modal-inner" onClick={(e) => e.stopPropagation()}>
            {previewState === 'loading' && <p className="admin-muted">Loading screenshot…</p>}
            {previewState === 'empty' && <p className="admin-muted">No screenshot was uploaded for this deposit.</p>}
            {previewState === 'error' && <p className="admin-error">Could not load the screenshot. Try again.</p>}
            {previewState === 'ready' && preview && <img src={preview} alt="Screenshot preview" />}
            <button type="button" className="admin-btn admin-btn--sm" onClick={closePreview}>Close</button>
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="admin-modal" onClick={() => setApproveTarget(null)} role="presentation">
          <div className="admin-modal-inner admin-approve-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Credit Received Payment</h3>
            <p className="admin-muted">{approveTarget.username} · {approveTarget.email}</p>
            <p className="admin-muted">Claimed: ${approveTarget.amount} USDT ({approveTarget.exchange} {approveTarget.network})</p>
            <label className="admin-field">
              <span>Received amount (USDT)</span>
              <input
                type="number"
                min="0"
                step="any"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Amount actually received"
              />
            </label>
            {msg && <p className="admin-error">{msg}</p>}
            <div className="admin-deposit-actions">
              <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy} onClick={confirmApprove}>
                {busy ? 'Processing...' : 'Confirm & Credit User'}
              </button>
              <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setApproveTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
