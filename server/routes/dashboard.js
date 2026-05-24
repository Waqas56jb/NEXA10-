import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { dbConfigured } from '../config/supabase.js';

const router = Router();

router.get('/stats', requireAdmin, async (_req, res) => {
  const [users, pending, approved, notifications] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  const { data: balanceRows } = await supabase.from('users').select('balance');
  const totalBalance = (balanceRows || []).reduce((s, u) => s + parseFloat(u.balance || 0), 0);

  res.json({
    users: users.count || 0,
    pendingDeposits: pending.count || 0,
    approvedDeposits: approved.count || 0,
    activeNotifications: notifications.count || 0,
    totalBalance,
  });
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    database: dbConfigured() ? 'configured' : 'missing env',
    timestamp: new Date().toISOString(),
  });
});

export default router;
