import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin, requireUser, optionalUser } from '../middleware/auth.js';

const router = Router();

// Every column except `screenshot_url`. Screenshots are stored as base64 data
// URLs, so including them in a list response makes it megabytes wide; they are
// fetched one at a time instead.
export const DEPOSIT_LIST_COLUMNS =
  'id, user_id, exchange, network, email, username, amount, approved_amount, status, admin_note, reviewed_by, created_at, reviewed_at';

async function findUserByDepositInfo(email, username) {
  if (!email && !username) return null;
  let query = supabase.from('users').select('id');
  if (email) {
    const { data } = await query.eq('email', email.trim().toLowerCase()).maybeSingle();
    if (data) return data;
  }
  if (username) {
    const { data } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (data) return data;
  }
  return null;
}

// Customer: submit deposit
router.post('/', optionalUser, async (req, res) => {
  try {
    const { exchange, network, email, username, amount, screenshot } = req.body;
    if (!exchange || !network || !email || !username || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let userId = req.user?.id || null;
    if (!userId) {
      const matched = await findUserByDepositInfo(email, username);
      userId = matched?.id || null;
    }

    const { data, error } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        exchange,
        network,
        email: email.trim().toLowerCase(),
        username,
        amount: parseFloat(amount),
        screenshot_url: screenshot || null,
        status: 'pending',
      })
      .select(DEPOSIT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    res.status(201).json({ deposit: data });
  } catch (err) {
    console.error('Create deposit error:', err);
    res.status(500).json({ error: 'Failed to submit deposit' });
  }
});

// Customer: my deposits
router.get('/mine', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('deposits')
    .select(DEPOSIT_LIST_COLUMNS)
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ deposits: data });
});

// Admin: list all
router.get('/admin/all', requireAdmin, async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('deposits').select(DEPOSIT_LIST_COLUMNS).order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);

  const [listRes, screenshotRes] = await Promise.all([
    query,
    supabase.from('deposits').select('id').not('screenshot_url', 'is', null),
  ]);

  if (listRes.error) return res.status(500).json({ error: listRes.error.message });

  const screenshotIds = new Set((screenshotRes.data || []).map((d) => d.id));
  const deposits = (listRes.data || []).map((d) => ({ ...d, has_screenshot: screenshotIds.has(d.id) }));
  res.json({ deposits });
});

// Admin: fetch a single screenshot on demand
router.get('/admin/:id/screenshot', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('deposits')
    .select('screenshot_url')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Deposit not found' });
  res.json({ screenshot: data.screenshot_url || null });
});

router.patch('/admin/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { approved_amount } = req.body;
    const { data: deposit, error: depErr } = await supabase
      .from('deposits')
      .select(DEPOSIT_LIST_COLUMNS)
      .eq('id', req.params.id)
      .single();

    if (depErr || !deposit) return res.status(404).json({ error: 'Deposit not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: 'Deposit already reviewed' });
    }

    let userId = deposit.user_id;
    if (!userId) {
      const matched = await findUserByDepositInfo(deposit.email, deposit.username);
      userId = matched?.id || null;
    }

    const amt = parseFloat(approved_amount ?? deposit.amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: 'Invalid received amount' });
    }

    const now = new Date().toISOString();

    if (userId) {
      const { data: user } = await supabase.from('users').select('balance, deposit_total').eq('id', userId).single();
      if (user) {
        await supabase.from('users').update({
          balance: parseFloat(user.balance) + amt,
          deposit_total: parseFloat(user.deposit_total) + amt,
        }).eq('id', userId);

        await supabase.from('fund_transfers').insert({
          user_id: userId,
          type: 'incoming',
          amount: amt,
          note: `Deposit approved (${deposit.exchange} ${deposit.network})`,
          source: 'deposit',
          deposit_id: deposit.id,
          admin_id: req.admin.id,
        });
      }
    }

    const { data: updated, error } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        approved_amount: amt,
        reviewed_at: now,
        reviewed_by: req.admin.id,
        user_id: userId,
      })
      .eq('id', deposit.id)
      .select(DEPOSIT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    res.json({ deposit: updated });
  } catch (err) {
    console.error('Approve deposit error:', err);
    res.status(500).json({ error: 'Approval failed' });
  }
});

router.patch('/admin/:id/reject', requireAdmin, async (req, res) => {
  const { admin_note } = req.body;
  const { data, error } = await supabase
    .from('deposits')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.admin.id,
      admin_note: admin_note || null,
    })
    .eq('id', req.params.id)
    .select(DEPOSIT_LIST_COLUMNS)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ deposit: data });
});

export default router;
