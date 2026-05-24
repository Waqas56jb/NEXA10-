import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

router.get('/:id', requireAdmin, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });

  const { data: transfers } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('user_id', req.params.id)
    .order('created_at', { ascending: false });

  res.json({ user, transfers: transfers || [] });
});

router.patch('/:id/block', requireAdmin, async (req, res) => {
  const { blocked } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ blocked: Boolean(blocked) })
    .eq('id', req.params.id)
    .select('id, blocked')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'User deleted' });
});

router.post('/:id/funds', requireAdmin, async (req, res) => {
  try {
    const { type, amount, note } = req.body;
    const amt = parseFloat(amount);
    if (!['incoming', 'outgoing'].includes(type) || !amt || amt <= 0) {
      return res.status(400).json({ error: 'Invalid type or amount' });
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, balance')
      .eq('id', req.params.id)
      .single();

    if (userErr || !user) return res.status(404).json({ error: 'User not found' });

    const currentBalance = parseFloat(user.balance);
    if (type === 'outgoing' && currentBalance < amt) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = type === 'incoming' ? currentBalance + amt : currentBalance - amt;

    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', req.params.id);

    if (updateErr) throw updateErr;

    const { data: transfer, error: transferErr } = await supabase
      .from('fund_transfers')
      .insert({
        user_id: req.params.id,
        type,
        amount: amt,
        note: note || '',
        source: 'admin',
        admin_id: req.admin.id,
      })
      .select()
      .single();

    if (transferErr) throw transferErr;

    res.json({ transfer, balance: newBalance });
  } catch (err) {
    console.error('Fund transfer error:', err);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

export default router;
