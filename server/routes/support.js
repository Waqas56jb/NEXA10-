import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

const MAX_TEXT = 2000;
const MAX_IMAGE_BYTES = 700 * 1024; // ~700 KB base64 data URL → ~520 KB binary

/* ── helpers ─────────────────────────────────────────────────────────── */

function validateMessageBody(body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const image = typeof body?.image_url === 'string' ? body.image_url.trim() : '';

  if (!text && !image) return { error: 'Message text or image is required' };
  if (text.length > MAX_TEXT) return { error: `Message too long (max ${MAX_TEXT} chars)` };
  if (image) {
    if (!image.startsWith('data:image/')) {
      return { error: 'Image must be a base64 data URL (data:image/...)' };
    }
    if (image.length > MAX_IMAGE_BYTES) {
      return { error: 'Image too large (>500 KB after compression). Please retry with a smaller image.' };
    }
  }
  return { text: text || null, image_url: image || null };
}

async function bumpCaseAfterMessage(caseId, sender) {
  const patch = {
    last_message_at: new Date().toISOString(),
    last_sender: sender,
  };
  if (sender === 'user') {
    patch.unread_for_admin = true;
    patch.unread_for_user = false;
  } else if (sender === 'admin') {
    patch.unread_for_user = true;
    patch.unread_for_admin = false;
  }
  await supabase.from('support_cases').update(patch).eq('id', caseId);
}

/* ── CUSTOMER ENDPOINTS ──────────────────────────────────────────────── */

// List my cases (newest first), each with last message preview.
router.get('/mine', requireUser, async (req, res) => {
  const { data: cases, error } = await supabase
    .from('support_cases')
    .select('*')
    .eq('user_id', req.user.id)
    .order('last_message_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ cases });
});

// Get the currently-open case (or null).
router.get('/mine/open', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('support_cases')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'open')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ case: data || null });
});

// Get a single case + all messages (user must own it).
router.get('/mine/:id', requireUser, async (req, res) => {
  const { data: c, error: cErr } = await supabase
    .from('support_cases')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
  if (cErr || !c) return res.status(404).json({ error: 'Case not found' });

  const { data: msgs, error: mErr } = await supabase
    .from('support_messages')
    .select('*')
    .eq('case_id', c.id)
    .order('created_at', { ascending: true });
  if (mErr) return res.status(500).json({ error: mErr.message });

  // Mark user-side read whenever they open the case
  if (c.unread_for_user) {
    await supabase.from('support_cases').update({ unread_for_user: false }).eq('id', c.id);
    c.unread_for_user = false;
  }

  res.json({ case: c, messages: msgs });
});

// Create a new case (only if no open one exists). Optional first message body.
router.post('/', requireUser, async (req, res) => {
  try {
    const subject = (req.body?.subject || 'Support request').toString().trim().slice(0, 200);

    // Reject if user already has an open case
    const { data: openExisting } = await supabase
      .from('support_cases')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'open')
      .maybeSingle();
    if (openExisting) {
      return res.status(409).json({ error: 'You already have an open case', case_id: openExisting.id });
    }

    const { data: created, error } = await supabase
      .from('support_cases')
      .insert({
        user_id: req.user.id,
        subject: subject || 'Support request',
        status: 'open',
        last_message_at: new Date().toISOString(),
        last_sender: 'user',
        unread_for_admin: true,
      })
      .select()
      .single();
    if (error) throw error;

    // If they sent a first message with the case, insert it too
    let firstMessage = null;
    if (req.body?.text || req.body?.image_url) {
      const parsed = validateMessageBody(req.body);
      if (!parsed.error) {
        const { data: m } = await supabase
          .from('support_messages')
          .insert({
            case_id: created.id,
            sender: 'user',
            sender_id: req.user.id,
            text: parsed.text,
            image_url: parsed.image_url,
          })
          .select()
          .single();
        firstMessage = m;
      }
    }

    res.status(201).json({ case: created, message: firstMessage });
  } catch (err) {
    console.error('Create support case error:', err);
    res.status(500).json({ error: err.message || 'Failed to open case' });
  }
});

// Append a message to one of MY cases (must be open).
router.post('/mine/:id/messages', requireUser, async (req, res) => {
  try {
    const parsed = validateMessageBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { data: c, error: cErr } = await supabase
      .from('support_cases')
      .select('id, user_id, status')
      .eq('id', req.params.id)
      .single();
    if (cErr || !c) return res.status(404).json({ error: 'Case not found' });
    if (c.user_id !== req.user.id) return res.status(403).json({ error: 'Not your case' });
    if (c.status !== 'open') return res.status(403).json({ error: 'Case is closed. Start a new one.' });

    const { data: msg, error } = await supabase
      .from('support_messages')
      .insert({
        case_id: c.id,
        sender: 'user',
        sender_id: req.user.id,
        text: parsed.text,
        image_url: parsed.image_url,
      })
      .select()
      .single();
    if (error) throw error;

    await bumpCaseAfterMessage(c.id, 'user');
    res.status(201).json({ message: msg });
  } catch (err) {
    console.error('User send message error:', err);
    res.status(500).json({ error: err.message || 'Failed to send' });
  }
});

/* ── ADMIN ENDPOINTS ─────────────────────────────────────────────────── */

// List all cases (optional ?status=open|closed, default all)
// includes a small join-ish payload: last message text snippet
router.get('/admin/cases', requireAdmin, async (req, res) => {
  const { status } = req.query;
  let query = supabase
    .from('support_cases')
    .select('*, users:user_id (email, username)')
    .order('last_message_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ cases: data });
});

// Get a single case + messages (admin)
router.get('/admin/cases/:id', requireAdmin, async (req, res) => {
  const { data: c, error: cErr } = await supabase
    .from('support_cases')
    .select('*, users:user_id (email, username, balance, blocked)')
    .eq('id', req.params.id)
    .single();
  if (cErr || !c) return res.status(404).json({ error: 'Case not found' });

  const { data: msgs, error: mErr } = await supabase
    .from('support_messages')
    .select('*')
    .eq('case_id', c.id)
    .order('created_at', { ascending: true });
  if (mErr) return res.status(500).json({ error: mErr.message });

  if (c.unread_for_admin) {
    await supabase.from('support_cases').update({ unread_for_admin: false }).eq('id', c.id);
    c.unread_for_admin = false;
  }

  res.json({ case: c, messages: msgs });
});

// Admin replies to a case (only if still open)
router.post('/admin/cases/:id/messages', requireAdmin, async (req, res) => {
  try {
    const parsed = validateMessageBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { data: c, error: cErr } = await supabase
      .from('support_cases')
      .select('id, status')
      .eq('id', req.params.id)
      .single();
    if (cErr || !c) return res.status(404).json({ error: 'Case not found' });
    if (c.status !== 'open') return res.status(403).json({ error: 'Case is closed' });

    const { data: msg, error } = await supabase
      .from('support_messages')
      .insert({
        case_id: c.id,
        sender: 'admin',
        sender_id: req.admin.id,
        text: parsed.text,
        image_url: parsed.image_url,
      })
      .select()
      .single();
    if (error) throw error;

    await bumpCaseAfterMessage(c.id, 'admin');
    res.status(201).json({ message: msg });
  } catch (err) {
    console.error('Admin send message error:', err);
    res.status(500).json({ error: err.message || 'Failed to send' });
  }
});

// Close a case (admin); also insert a system notice so the chat shows it
router.patch('/admin/cases/:id/close', requireAdmin, async (req, res) => {
  try {
    const note = (req.body?.close_note || '').toString().trim().slice(0, 500) || null;

    const { data: c, error: cErr } = await supabase
      .from('support_cases')
      .select('id, status')
      .eq('id', req.params.id)
      .single();
    if (cErr || !c) return res.status(404).json({ error: 'Case not found' });
    if (c.status === 'closed') return res.status(400).json({ error: 'Already closed' });

    const now = new Date().toISOString();

    await supabase.from('support_messages').insert({
      case_id: c.id,
      sender: 'system',
      sender_id: null,
      text: note ? `Case closed by support: ${note}` : 'Case closed by support.',
    });

    const { data: updated, error } = await supabase
      .from('support_cases')
      .update({
        status: 'closed',
        closed_at: now,
        closed_by: req.admin.id,
        close_note: note,
        last_message_at: now,
        last_sender: 'admin',
        unread_for_user: true,
        unread_for_admin: false,
      })
      .eq('id', c.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ case: updated });
  } catch (err) {
    console.error('Close case error:', err);
    res.status(500).json({ error: err.message || 'Close failed' });
  }
});

export default router;
