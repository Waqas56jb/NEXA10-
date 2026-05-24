import { Fragment, useEffect, useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { formatTimeAgo } from '../lib/api';

export default function AdminUsersPage() {
  const { users, loading, error, actions } = useAdminData();
  const [expanded, setExpanded] = useState(null);
  const [fundForm, setFundForm] = useState({ type: 'incoming', amount: '', note: '' });
  const [msg, setMsg] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setTransfers([]);
      return;
    }
    let cancelled = false;
    actions.getFundTransfers(expanded).then((t) => {
      if (!cancelled) setTransfers(t);
    }).catch(() => {
      if (!cancelled) setTransfers([]);
    });
    return () => { cancelled = true; };
  }, [expanded]);

  const toggleBlock = async (user) => {
    setBusy(true);
    try {
      await actions.blockUser(user.id, !user.blocked);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setBusy(true);
    try {
      await actions.deleteUser(id);
      setExpanded(null);
    } finally {
      setBusy(false);
    }
  };

  const sendFunds = async (userId) => {
    setMsg('');
    setBusy(true);
    try {
      const result = await actions.addFunds(userId, fundForm.type, fundForm.amount, fundForm.note);
      if (result?.error) {
        setMsg('Insufficient balance for outgoing transfer');
        return;
      }
      setMsg(`${fundForm.type === 'incoming' ? 'Added' : 'Deducted'} $${fundForm.amount} successfully`);
      setFundForm({ type: 'incoming', amount: '', note: '' });
      const history = await actions.getFundTransfers(userId);
      setTransfers(history);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.message || 'Transfer failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-page"><p className="admin-muted">Loading users...</p></div>;
  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">User Management</h2>
      <p className="admin-page-desc">View all users, block, delete, and manage incoming/outgoing funds.</p>

      {users.length === 0 ? (
        <div className="admin-panel admin-empty-state">No users registered yet. Users appear after signup or deposit.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Deposits</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr className={expanded === u.id ? 'expanded' : ''}>
                    <td><strong>{u.username}</strong></td>
                    <td className="admin-muted">{u.email}</td>
                    <td className="admin-amount">${(u.balance || 0).toFixed(2)}</td>
                    <td>${(u.depositTotal || 0).toFixed(2)}</td>
                    <td>
                      <span className={`admin-status${u.blocked ? ' admin-status--blocked' : ' admin-status--active'}`}>
                        {u.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="admin-muted">{formatTimeAgo(u.createdAt)}</td>
                    <td className="admin-actions">
                      <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
                        {expanded === u.id ? 'Close' : 'Funds'}
                      </button>
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--warn" disabled={busy} onClick={() => toggleBlock(u)}>
                        {u.blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" disabled={busy} onClick={() => remove(u.id)}>Delete</button>
                    </td>
                  </tr>
                  {expanded === u.id && (
                    <tr className="admin-detail-row">
                      <td colSpan={7}>
                        <div className="admin-user-detail">
                          <div className="admin-fund-forms">
                            <h4>Send / Return Funds</h4>
                            {msg && <p className="admin-msg">{msg}</p>}
                            <div className="admin-fund-row">
                              <select value={fundForm.type} onChange={(e) => setFundForm({ ...fundForm, type: e.target.value })}>
                                <option value="incoming">Incoming (Credit)</option>
                                <option value="outgoing">Outgoing (Debit)</option>
                              </select>
                              <input type="number" min="0" step="any" placeholder="Amount USDT" value={fundForm.amount} onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })} />
                              <input type="text" placeholder="Note (optional)" value={fundForm.note} onChange={(e) => setFundForm({ ...fundForm, note: e.target.value })} />
                              <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" disabled={busy} onClick={() => sendFunds(u.id)}>Apply</button>
                            </div>
                          </div>
                          <div className="admin-transfer-history">
                            <h4>Fund History</h4>
                            {transfers.length === 0 ? (
                              <p className="admin-muted">No transfers yet</p>
                            ) : (
                              <ul>
                                {transfers.map((t) => (
                                  <li key={t.id} className={t.type === 'incoming' ? 'in' : 'out'}>
                                    <span className="admin-transfer-type">{t.type === 'incoming' ? '↓ In' : '↑ Out'}</span>
                                    <span className="admin-amount">${t.amount.toFixed(2)}</span>
                                    <span>{t.note || '—'}</span>
                                    <span className="admin-muted">{formatTimeAgo(t.createdAt)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
