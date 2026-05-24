import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

router.get('/mine', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('fund_transfers')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ transfers: data });
});

export default router;
