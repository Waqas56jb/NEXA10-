import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, formatTimeAgo } from '../lib/api';

const LIST_POLL_MS = 5000;
const CHAT_POLL_MS = 3000;

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSupportPage() {
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState('open');
  const [activeId, setActiveId] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [imgPreview, setImgPreview] = useState(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const threadRef = useRef(null);

  const loadList = useCallback(async () => {
    try {
      const res = await adminApi.getSupportCases('all');
      setCases(res?.cases || []);
    } catch (e) {
      setErr(e.message || 'Failed to load cases');
    }
  }, []);

  const loadActive = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await adminApi.getSupportCase(id);
      setActiveCase(res?.case || null);
      setMessages(res?.messages || []);
    } catch (e) {
      setErr(e.message || 'Failed to load chat');
    }
  }, []);

  // Initial + polled list
  useEffect(() => {
    loadList();
    const id = setInterval(loadList, LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadList]);

  // Polled active chat
  useEffect(() => {
    if (!activeId) return undefined;
    loadActive(activeId);
    const id = setInterval(() => loadActive(activeId), CHAT_POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadActive]);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return cases;
    return cases.filter((c) => c.status === filter);
  }, [cases, filter]);

  const pendingCount = useMemo(
    () => cases.filter((c) => c.status === 'open' && c.unread_for_admin).length,
    [cases],
  );

  const isLocked = activeCase?.status === 'closed';

  const sendReply = async () => {
    if (!activeCase || isLocked) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setErr('');
    try {
      await adminApi.sendSupportMessage(activeCase.id, { text });
      setDraft('');
      await loadActive(activeCase.id);
      await loadList();
    } catch (e) {
      setErr(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const closeCase = async () => {
    if (!activeCase) return;
    setBusy(true);
    setErr('');
    try {
      await adminApi.closeSupportCase(activeCase.id, closeNote.trim() || null);
      setCloseOpen(false);
      setCloseNote('');
      await loadActive(activeCase.id);
      await loadList();
    } catch (e) {
      setErr(e.message || 'Failed to close');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page admin-support">
      <h2 className="admin-page-title">
        Customer Support
        {pendingCount > 0 && <span className="admin-badge" style={{ marginLeft: 10 }}>{pendingCount} new</span>}
      </h2>
      <p className="admin-page-desc">
        Cases stay open until you close them. Closing locks both sides of the chat — the user must open a new case to continue.
      </p>

      <div className="admin-tabs">
        {['open', 'closed', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'open' && ` (${cases.filter((c) => c.status === 'open').length})`}
          </button>
        ))}
      </div>

      <div className="admin-support-layout">
        {/* LIST */}
        <aside className="admin-support-list">
          {filtered.length === 0 ? (
            <p className="admin-muted" style={{ padding: 20, textAlign: 'center' }}>
              No {filter === 'all' ? '' : filter} cases
            </p>
          ) : (
            filtered.map((c) => {
              const user = c.users || {};
              const isActive = c.id === activeId;
              const unread = c.unread_for_admin && c.status === 'open';
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`admin-support-item${isActive ? ' active' : ''}${unread ? ' unread' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div className="admin-support-item-head">
                    <strong>{user.username || user.email || 'User'}</strong>
                    <span className={`admin-status admin-status--${c.status}`}>{c.status}</span>
                  </div>
                  <div className="admin-support-item-subject">{c.subject}</div>
                  <div className="admin-support-item-foot">
                    <span className="admin-muted">{formatTimeAgo(new Date(c.last_message_at).getTime())}</span>
                    {unread && <span className="admin-support-dot" />}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* CHAT PANE */}
        <section className="admin-support-pane">
          {!activeCase ? (
            <div className="admin-support-empty">
              <p>Select a case from the list to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="admin-support-head">
                <div className="admin-support-head-text">
                  <strong>{activeCase.users?.username || activeCase.users?.email || 'User'}</strong>
                  <span className="admin-muted">{activeCase.users?.email}</span>
                  <p className="admin-support-subject">{activeCase.subject}</p>
                </div>
                <div className="admin-support-head-actions">
                  <span className={`admin-status admin-status--${activeCase.status}`}>{activeCase.status}</span>
                  {activeCase.status === 'open' && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--sm"
                      onClick={() => setCloseOpen(true)}
                    >
                      Close Case
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-support-thread" ref={threadRef}>
                {messages.length === 0 ? (
                  <p className="admin-muted" style={{ textAlign: 'center', padding: 30 }}>
                    No messages yet.
                  </p>
                ) : (
                  messages.map((m) => <AdminMessageBubble key={m.id} m={m} onImage={setImgPreview} />)
                )}
                {isLocked && (
                  <div className="admin-support-lock">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    This case is closed. Reply locked. User must start a new case.
                  </div>
                )}
              </div>

              {!isLocked && (
                <div className="admin-support-composer">
                  <input
                    type="text"
                    placeholder="Type your reply…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={sendReply}
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              )}
              {err && <p className="admin-error" style={{ padding: '8px 12px' }}>{err}</p>}
            </>
          )}
        </section>
      </div>

      {imgPreview && (
        <div className="admin-modal" onClick={() => setImgPreview(null)} role="presentation">
          <div className="admin-modal-inner" onClick={(e) => e.stopPropagation()}>
            <img src={imgPreview} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 8 }} />
            <button type="button" className="admin-btn admin-btn--sm" onClick={() => setImgPreview(null)}>Close</button>
          </div>
        </div>
      )}

      {closeOpen && (
        <div className="admin-modal" onClick={() => setCloseOpen(false)} role="presentation">
          <div className="admin-modal-inner admin-approve-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Close this case?</h3>
            <p className="admin-muted">
              Both sides will be locked from sending further messages. The user can open a new case any time.
            </p>
            <label className="admin-field">
              <span>Closing note (optional, visible to user)</span>
              <input
                type="text"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="e.g. Issue resolved — funds credited"
              />
            </label>
            {err && <p className="admin-error">{err}</p>}
            <div className="admin-deposit-actions">
              <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" disabled={busy} onClick={closeCase}>
                {busy ? 'Closing…' : 'Close Case & Lock Chat'}
              </button>
              <button type="button" className="admin-btn admin-btn--sm" disabled={busy} onClick={() => setCloseOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMessageBubble({ m, onImage }) {
  if (m.sender === 'system') {
    return (
      <div className="admin-support-system">
        <span>{m.text}</span>
        <time>{fmtTime(m.created_at)}</time>
      </div>
    );
  }
  const mine = m.sender === 'admin';
  return (
    <div className={`admin-support-msg ${mine ? 'admin-support-msg--me' : 'admin-support-msg--them'}`}>
      <div className="admin-support-bubble">
        {m.image_url && (
          <button type="button" className="admin-support-bubble-img" onClick={() => onImage(m.image_url)}>
            <img src={m.image_url} alt="Attachment" loading="lazy" />
          </button>
        )}
        {m.text && <p>{m.text}</p>}
      </div>
      <span className="admin-support-bubble-meta">{mine ? 'Support' : 'User'} · {fmtTime(m.created_at)}</span>
    </div>
  );
}
