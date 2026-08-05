import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { dbConfigured } from '../config/supabase.js';
import { DEPOSIT_LIST_COLUMNS } from './deposits.js';

const router = Router();

const USER_COLUMNS =
  'id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at';

function settled(result, fallback) {
  if (result.status !== 'fulfilled') return fallback;
  const { data, error } = result.value || {};
  if (error) return fallback;
  return data ?? fallback;
}

// Single round trip for the whole admin panel. The panel used to fire six
// separate requests per route, which on serverless meant six cold starts.
router.get('/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const [users, deposits, withScreenshot, withdrawals, cases, notifications] = await Promise.allSettled([
      supabase.from('users').select(USER_COLUMNS).order('created_at', { ascending: false }),
      supabase.from('deposits').select(DEPOSIT_LIST_COLUMNS).order('created_at', { ascending: false }),
      supabase.from('deposits').select('id').not('screenshot_url', 'is', null),
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase
        .from('support_cases')
        .select('*, users:user_id (email, username)')
        .order('last_message_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);

    const userRows = settled(users, []);
    const depositRows = settled(deposits, []);
    const withdrawalRows = settled(withdrawals, []);
    const caseRows = settled(cases, []);
    const notificationRows = settled(notifications, []);

    const screenshotIds = new Set(settled(withScreenshot, []).map((d) => d.id));
    const depositsWithFlag = depositRows.map((d) => ({
      ...d,
      has_screenshot: screenshotIds.has(d.id),
    }));

    const totalBalance = userRows.reduce((sum, u) => sum + parseFloat(u.balance || 0), 0);

    res.json({
      users: userRows,
      deposits: depositsWithFlag,
      withdrawals: withdrawalRows,
      cases: caseRows,
      notifications: notificationRows,
      stats: {
        users: userRows.length,
        pendingDeposits: depositRows.filter((d) => d.status === 'pending').length,
        approvedDeposits: depositRows.filter((d) => d.status === 'approved').length,
        pendingWithdrawals: withdrawalRows.filter((w) => w.status === 'pending').length,
        openSupportCases: caseRows.filter((c) => c.status === 'open').length,
        activeNotifications: notificationRows.filter((n) => n.active).length,
        totalBalance,
      },
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
});

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
