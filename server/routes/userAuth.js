import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

// ────────────────────────────────────────────────────────────────────────
// Earnings accrual
// ────────────────────────────────────────────────────────────────────────
// 0.18% per hour on deposit_total (matches the Invest page "NEXA10 Starter"
// calculator). Accrual is settled lazily — every time the client reads
// /me or toggles earning, we compute the elapsed seconds since the last
// settlement and credit balance + earnings_total.
const HOURLY_RATE = 0.0018;
const PER_SECOND_RATE = HOURLY_RATE / 3600; // 5e-7

const USER_FIELDS =
  'id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, earning_settled_at, created_at';

function round8(n) {
  return Math.round(n * 1e8) / 1e8;
}

/**
 * If the user is earning, credit any accrued earnings since their last
 * settlement, persist, and return the freshly settled row.
 * No-op (just returns the row) if not earning or no settle timestamp.
 */
async function settleEarnings(user) {
  if (!user || !user.earning_active || user.blocked) return user;

  const settledAt = user.earning_settled_at ? new Date(user.earning_settled_at) : null;
  if (!settledAt || Number.isNaN(settledAt.getTime())) {
    // No baseline → set one now, no credit on this read.
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('users')
      .update({ earning_settled_at: now })
      .eq('id', user.id)
      .select(USER_FIELDS)
      .single();
    return data || user;
  }

  const principal = parseFloat(user.deposit_total || 0);
  if (principal <= 0) return user; // no investment, nothing to accrue

  const now = Date.now();
  const elapsedSec = Math.max(0, (now - settledAt.getTime()) / 1000);
  // Drop sub-second slices so two near-simultaneous /me calls don't both credit.
  if (elapsedSec < 1) return user;

  const accrual = round8(principal * PER_SECOND_RATE * elapsedSec);
  if (accrual <= 0) return user;

  const newBalance = round8(parseFloat(user.balance || 0) + accrual);
  const newEarnings = round8(parseFloat(user.earnings_total || 0) + accrual);

  const { data, error } = await supabase
    .from('users')
    .update({
      balance: newBalance,
      earnings_total: newEarnings,
      earning_settled_at: new Date(now).toISOString(),
    })
    .eq('id', user.id)
    .select(USER_FIELDS)
    .single();

  if (error) {
    console.error('Settle earnings failed:', error.message);
    return user;
  }
  return data;
}

// ────────────────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalized = email.trim().toLowerCase();
    const password_hash = await hashPassword(password);
    const uname = username?.trim() || normalized.split('@')[0];

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: normalized,
        username: uname,
        password_hash,
      })
      .select(USER_FIELDS)
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw error;
    }

    const token = signToken({ sub: data.id, email: data.email, role: 'user' });
    res.status(201).json({ token, user: data });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`${USER_FIELDS}, password_hash`)
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.blocked) {
      return res.status(403).json({ error: 'Account blocked. Contact support.' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    delete user.password_hash;
    const settled = await settleEarnings(user);
    const token = signToken({ sub: user.id, email: user.email, role: 'user' });
    res.json({ token, user: settled });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found' });

  const settled = await settleEarnings(data);
  res.json({ user: settled });
});

router.patch('/me/earning', requireUser, async (req, res) => {
  const { active } = req.body;
  const wantActive = Boolean(active);

  // Load current row so we can settle if we're transitioning off.
  const { data: current, error: loadErr } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', req.user.id)
    .single();

  if (loadErr || !current) return res.status(404).json({ error: 'User not found' });

  // If currently active, settle pending accrual before flipping the switch.
  let working = current;
  if (current.earning_active) {
    working = await settleEarnings(current);
  }

  const patch = { earning_active: wantActive };
  if (wantActive) {
    // Start a new baseline now so the next read accrues from this instant.
    patch.earning_settled_at = new Date().toISOString();
  } else {
    patch.earning_settled_at = null;
  }

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', working.id)
    .select(USER_FIELDS)
    .single();

  if (error) return res.status(500).json({ error: 'Update failed' });
  res.json({ user: data });
});

export default router;
