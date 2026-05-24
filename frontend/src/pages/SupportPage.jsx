import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Particles from '../components/Particles';
import BgGrid from '../components/BgGrid';
import PageTop from '../components/PageTop';
import BottomNav from '../components/BottomNav';
import { useAppData } from '../context/AppDataContext';
import { getUserToken, isApiEnabled, userApi } from '../lib/api';
import { compressImage } from '../lib/imageCompress';
import '../styles/pages/support.css';

const POLL_MS = 3500;

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SupportPage() {
  const { currentUser, loading, apiMode } = useAppData();
  const [activeCase, setActiveCase] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [draftImage, setDraftImage] = useState(null);  // data URL
  const [draftImageName, setDraftImageName] = useState('');
  const [imgPreview, setImgPreview] = useState(null);  // larger preview src
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [subject, setSubject] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [openRes, allRes] = await Promise.all([
        userApi.myOpenSupportCase(),
        userApi.mySupportCases(),
      ]);
      const open = openRes?.case || null;
      setHistory(allRes?.cases || []);
      if (open) {
        const detail = await userApi.getSupportCase(open.id);
        setActiveCase(detail.case);
        setMessages(detail.messages || []);
      } else {
        setActiveCase(null);
        setMessages([]);
      }
    } catch (e) {
      setErr(e.message || 'Failed to load support');
    }
  }, []);

  useEffect(() => {
    if (!apiMode || !getUserToken()) return undefined;
    loadAll();
    const id = setInterval(loadAll, POLL_MS);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [apiMode, loadAll]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeCase?.id]);

  if (apiMode && !loading && !getUserToken()) return <Navigate to="/login" replace />;

  const isLocked = activeCase ? activeCase.status === 'closed' : false;

  const handleFile = async (e) => {
    setErr('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setBusy(true);
      const dataUrl = await compressImage(file, { maxDim: 1280, targetKB: 460 });
      setDraftImage(dataUrl);
      setDraftImageName(file.name);
    } catch (e2) {
      setErr(e2.message || 'Could not process image');
    } finally {
      setBusy(false);
    }
  };

  const dropImage = () => {
    setDraftImage(null);
    setDraftImageName('');
  };

  const openNewCase = async () => {
    setErr('');
    const subj = (subject || '').trim().slice(0, 200) || 'Support request';
    const text = draft.trim();
    if (!text && !draftImage) {
      setErr('Please describe your issue or attach a screenshot.');
      return;
    }
    setSending(true);
    try {
      const payload = { subject: subj };
      if (text) payload.text = text;
      if (draftImage) payload.image_url = draftImage;
      const res = await userApi.openSupportCase(payload);
      setActiveCase(res.case);
      setSubject('');
      setDraft('');
      dropImage();
      await loadAll();
    } catch (e2) {
      setErr(e2.message || 'Failed to open case');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!activeCase || isLocked) return;
    setErr('');
    const text = draft.trim();
    if (!text && !draftImage) return;
    setSending(true);
    try {
      const payload = {};
      if (text) payload.text = text;
      if (draftImage) payload.image_url = draftImage;
      await userApi.sendSupportMessage(activeCase.id, payload);
      setDraft('');
      dropImage();
      await loadAll();
    } catch (e2) {
      setErr(e2.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      activeCase ? sendMessage() : openNewCase();
    }
  };

  return (
    <>
      <Particles connectLines count={60} />
      <BgGrid orbs />
      <PageTop
        title="Support"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        }
        extra={
          history.length > 0 ? (
            <button type="button" className="sp-history-btn" onClick={() => setHistoryOpen(true)}>
              History ({history.length})
            </button>
          ) : null
        }
      />

      <main className="sp-main">
        {!activeCase ? (
          <section className="sp-card sp-open-card">
            <div className="sp-open-illust" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h2 className="sp-card-title">Need a hand?</h2>
            <p className="sp-card-sub">
              Open a new case and our team will reply within minutes. Once your case is resolved, the chat closes — you can always open a new one.
            </p>

            <label className="sp-label">Subject</label>
            <input
              className="sp-input"
              type="text"
              maxLength={200}
              placeholder="e.g. Deposit not credited"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              lang="en"
              autoCapitalize="sentences"
              autoCorrect="off"
              spellCheck={false}
            />

            <label className="sp-label">Describe the issue</label>
            <textarea
              className="sp-textarea"
              rows={4}
              maxLength={2000}
              placeholder="Tell us what's happening, paste any reference IDs, and attach a screenshot if useful."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              lang="en"
              autoCapitalize="sentences"
              autoCorrect="off"
              spellCheck={false}
            />

            <div className="sp-attach-row">
              <button
                type="button"
                className="sp-attach-btn"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {busy ? 'Compressing…' : draftImage ? 'Change screenshot' : 'Attach screenshot'}
              </button>
              {draftImage && (
                <div className="sp-thumb">
                  <img src={draftImage} alt={draftImageName} onClick={() => setImgPreview(draftImage)} />
                  <button type="button" className="sp-thumb-x" onClick={dropImage} aria-label="Remove">×</button>
                </div>
              )}
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={handleFile} />
            </div>

            {err && <p className="sp-err">{err}</p>}

            <button
              type="button"
              className="sp-primary-btn"
              onClick={openNewCase}
              disabled={sending || busy}
            >
              {sending ? 'Opening…' : 'Open Case →'}
            </button>
          </section>
        ) : (
          <section className="sp-card sp-chat-card">
            {/* Header */}
            <div className="sp-chat-head">
              <div className="sp-chat-head-text">
                <span className={`sp-status sp-status--${activeCase.status}`}>{activeCase.status}</span>
                <h2 className="sp-chat-subject">{activeCase.subject}</h2>
                <span className="sp-chat-meta">Opened {fmtTime(activeCase.created_at)}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="sp-thread" ref={scrollRef}>
              {messages.length === 0 ? (
                <p className="sp-empty">No messages yet — say hi 👋</p>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} m={m} onImage={setImgPreview} />)
              )}
              {isLocked && (
                <div className="sp-lock-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>
                    This case is closed. Reply is locked — open a new case if you need more help.
                  </span>
                </div>
              )}
            </div>

            {/* Composer */}
            {!isLocked && (
              <div className="sp-composer">
                {draftImage && (
                  <div className="sp-composer-thumb">
                    <img src={draftImage} alt={draftImageName} onClick={() => setImgPreview(draftImage)} />
                    <button type="button" className="sp-thumb-x" onClick={dropImage} aria-label="Remove">×</button>
                  </div>
                )}
                <div className="sp-composer-row">
                  <button
                    type="button"
                    className="sp-icon-btn"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy || sending}
                    aria-label="Attach"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <input ref={fileRef} hidden type="file" accept="image/*" onChange={handleFile} />
                  <input
                    className="sp-composer-input"
                    type="text"
                    placeholder="Type your message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    maxLength={2000}
                    lang="en"
                    autoCapitalize="sentences"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="sp-send-btn"
                    onClick={sendMessage}
                    disabled={sending || busy || (!draft.trim() && !draftImage)}
                    aria-label="Send"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
                {(busy || err) && (
                  <p className={`sp-composer-foot${err ? ' sp-composer-foot--err' : ''}`}>
                    {err || 'Compressing image…'}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* History sheet */}
      {historyOpen && (
        <div className="sp-sheet" role="dialog" aria-modal="true" onClick={() => setHistoryOpen(false)}>
          <div className="sp-sheet-inner" onClick={(e) => e.stopPropagation()}>
            <div className="sp-sheet-head">
              <h3>Your Cases</h3>
              <button type="button" className="sp-sheet-close" onClick={() => setHistoryOpen(false)} aria-label="Close">×</button>
            </div>
            <ul className="sp-case-list">
              {history.map((c) => (
                <li key={c.id} className={`sp-case-row sp-case-row--${c.status}`}>
                  <div className="sp-case-main">
                    <span className={`sp-status sp-status--${c.status}`}>{c.status}</span>
                    <strong>{c.subject}</strong>
                    <span className="sp-case-time">Updated {fmtTime(c.last_message_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Image preview lightbox */}
      {imgPreview && (
        <div className="sp-lightbox" onClick={() => setImgPreview(null)} role="presentation">
          <img src={imgPreview} alt="Preview" />
          <button type="button" className="sp-lightbox-close" onClick={() => setImgPreview(null)} aria-label="Close">×</button>
        </div>
      )}

      <BottomNav />
    </>
  );
}

function MessageBubble({ m, onImage }) {
  if (m.sender === 'system') {
    return (
      <div className="sp-system">
        <span>{m.text}</span>
        <time>{fmtTime(m.created_at)}</time>
      </div>
    );
  }
  const mine = m.sender === 'user';
  return (
    <div className={`sp-msg ${mine ? 'sp-msg--me' : 'sp-msg--them'}`}>
      <div className="sp-bubble">
        {m.image_url && (
          <button type="button" className="sp-bubble-img" onClick={() => onImage(m.image_url)} aria-label="View image">
            <img src={m.image_url} alt="Attachment" loading="lazy" />
          </button>
        )}
        {m.text && <p className="sp-bubble-text">{m.text}</p>}
      </div>
      <span className="sp-bubble-meta">{mine ? 'You' : 'Support'} · {fmtTime(m.created_at)}</span>
    </div>
  );
}
