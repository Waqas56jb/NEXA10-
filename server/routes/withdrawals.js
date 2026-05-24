import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';

const router = Router();

const MIN_WITHDRAW = 1;

// ─── Customer: submit a withdrawal request ──────────────────────────────
// Deducts balance immediately so the user can't double-spend while pending.
router.post('/', requireUser, async (req, res) => {
  try {
    const { amount, account_holder_name, account_number, bank_name } = req.body || {};
    const amt = parseFloat(amount);

    if (!amt || !Number.isFinite(amt) || amt < MIN_WITHDRAW) {
      return res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAW}` });
    }
    if (!account_holder_name?.trim() || !account_number?.trim()) {
      return res.status(400).json({ error: 'Account holder name and account number are required' });
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, username, balance, blocked')
      .eq('id', req.user.id)
      .single();

    if (userErr || !user) return res.status(404).json({ error: 'User not found' });
    if (user.blocked) return res.status(403).json({ error: 'Account blocked — contact support' });

    const currentBalance = parseFloat(user.balance || 0);
    if (amt > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 1. Deduct balance immediately (single-row UPDATE — concurrent races won't
    //    overdraw because the next read sees the new value).
    const newBalance = +(currentBalance - amt).toFixed(8);
    const { error: balErr } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id);
    if (balErr) throw balErr;

    // 2. Insert withdrawal row (pending).
    const { data: withdrawal, error: wErr } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_username: user.username,
        amount: amt,
        account_holder_name: account_holder_name.trim(),
        account_number: account_number.trim(),
        bank_name: bank_name?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (wErr) {
      // refund and bail
      await supabase.from('users').update({ balance: currentBalance }).eq('id', user.id);
      throw wErr;
    }

    // 3. Log the debit in fund_transfers for audit trail.
    await supabase.from('fund_transfers').insert({
      user_id: user.id,
      type: 'outgoing',
      amount: amt,
      note: `Withdrawal requested → ${account_holder_name.trim()} · ${account_number.trim()}`,
      source: 'withdrawal',
      withdrawal_id: withdrawal.id,
    });

    res.status(201).json({ withdrawal, newBalance });
  } catch (err) {
    console.error('Create withdrawal error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit withdrawal' });
  }
});

// ─── Customer: my withdrawal history ────────────────────────────────────
router.get('/mine', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ withdrawals: data });
});

// ─── Admin: list all withdrawals (optional ?status= filter) ─────────────
router.get('/admin/all', requireAdmin, async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ withdrawals: data });
});

// ─── Admin: approve (mark sent — balance already deducted at request) ───
router.patch('/admin/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { admin_note } = req.body || {};
    const { data: w, error: findErr } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findErr || !w) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' });

    const { data: updated, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.admin.id,
        admin_note: admin_note || null,
      })
      .eq('id', w.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ withdrawal: updated });
  } catch (err) {
    console.error('Approve withdrawal error:', err);
    res.status(500).json({ error: err.message || 'Approval failed' });
  }
});

// ─── Admin: reject (refund balance back to user) ────────────────────────
router.patch('/admin/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { admin_note } = req.body || {};
    const { data: w, error: findErr } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findErr || !w) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' });

    const refundAmt = parseFloat(w.amount);

    // Refund balance
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('balance')
      .eq('id', w.user_id)
      .single();
    if (userErr || !user) return res.status(404).json({ error: 'User not found' });

    const newBalance = +(parseFloat(user.balance || 0) + refundAmt).toFixed(8);
    await supabase.from('users').update({ balance: newBalance }).eq('id', w.user_id);

    // Refund audit entry
    await supabase.from('fund_transfers').insert({
      user_id: w.user_id,
      type: 'incoming',
      amount: refundAmt,
      note: `Withdrawal rejected — refund${admin_note ? ` (${admin_note})` : ''}`,
      source: 'withdrawal',
      withdrawal_id: w.id,
      admin_id: req.admin.id,
    });

    const { data: updated, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.admin.id,
        admin_note: admin_note || null,
      })
      .eq('id', w.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ withdrawal: updated, refundedTo: w.user_id, newBalance });
  } catch (err) {
    console.error('Reject withdrawal error:', err);
    res.status(500).json({ error: err.message || 'Rejection failed' });
  }
});

export default router;
