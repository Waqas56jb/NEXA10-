import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

// ────────────────────────────────────────────────────────────────────────
// Earnings accrual
// ────────────────────────────────────────────────────────────────────────
// 0.08% per hour on deposit_total (matches the Invest "NEXA10 Starter"
// calculator). Accrual is settled lazily: every time the client reads
// the account or toggles earning, we compute the elapsed seconds since
// the last settlement and credit balance + earnings_total.
//
// IMPORTANT: this code is tolerant of the earning_settled_at column not
// yet existing in the database. If the migration hasn't been applied,
// accrual is silently skipped and a one-shot warning is logged — but
// register / login / /me never crash because of it.

const HOURLY_RATE = 0.0008;
const PER_SECOND_RATE = HOURLY_RATE / 3600;

// Safe-to-select columns (these exist in the original schema).
const USER_FIELDS_BASE =
  'id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at';

let migrationWarned = false;
function isMissingSettledColumn(err) {
  if (!err) return false;
  const txt = `${err.message || ''} ${err.details || ''} ${err.hint || ''}`.toLowerCase();
  return txt.includes('earning_settled_at') || txt.includes("column ") && txt.includes("settled");
}
function warnMissingColumnOnce() {
  if (migrationWarned) return;
  migrationWarned = true;
  console.warn(
    '[earnings] users.earning_settled_at column not found — accrual is disabled. ' +
      'Run server/supabase/migration_earnings_accrual.sql to enable it.',
  );
}

function round8(n) {
  return Math.round(n * 1e8) / 1e8;
}

/** Read the user row, with `earning_settled_at` when the column exists. */
async function loadUser(userId) {
  // Try the wide select first
  const wide = await supabase
    .from('users')
    .select(`${USER_FIELDS_BASE}, earning_settled_at`)
    .eq('id', userId)
    .single();
  if (!wide.error) return wide.data;
  if (isMissingSettledColumn(wide.error)) {
    warnMissingColumnOnce();
    const safe = await supabase.from('users').select(USER_FIELDS_BASE).eq('id', userId).single();
    return safe.data || null;
  }
  // Some other error — propagate by returning null
  console.error('loadUser failed:', wide.error.message);
  return null;
}

/**
 * If the user is earning, credit any accrued earnings since their last
 * settlement, persist, and return the updated user. If the migration
 * hasn't been applied, silently no-op (returns the input row unchanged).
 */
async function settleEarnings(user) {
  if (!user || !user.earning_active || user.blocked) return user;
  if (!('earning_settled_at' in user)) return user; // column missing → skip

  const settledAt = user.earning_settled_at ? new Date(user.earning_settled_at) : null;
  if (!settledAt || Number.isNaN(settledAt.getTime())) {
    // No baseline → set one now, don't credit on this read.
    const upd = await supabase
      .from('users')
      .update({ earning_settled_at: new Date().toISOString() })
      .eq('id', user.id)
      .select(`${USER_FIELDS_BASE}, earning_settled_at`)
      .single();
    if (upd.error) {
      if (isMissingSettledColumn(upd.error)) warnMissingColumnOnce();
      return user;
    }
    return upd.data || user;
  }

  const principal = parseFloat(user.deposit_total || 0);
  if (principal <= 0) return user;

  const now = Date.now();
  const elapsedSec = Math.max(0, (now - settledAt.getTime()) / 1000);
  if (elapsedSec < 1) return user;

  const accrual = round8(principal * PER_SECOND_RATE * elapsedSec);
  if (accrual <= 0) return user;

  const newBalance = round8(parseFloat(user.balance || 0) + accrual);
  const newEarnings = round8(parseFloat(user.earnings_total || 0) + accrual);

  const upd = await supabase
    .from('users')
    .update({
      balance: newBalance,
      earnings_total: newEarnings,
      earning_settled_at: new Date(now).toISOString(),
    })
    .eq('id', user.id)
    .select(`${USER_FIELDS_BASE}, earning_settled_at`)
    .single();

  if (upd.error) {
    if (isMissingSettledColumn(upd.error)) warnMissingColumnOnce();
    console.error('Settle earnings failed:', upd.error.message);
    return user;
  }
  return upd.data || user;
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
      .select(USER_FIELDS_BASE)
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw error;
    }

    const token = signToken({ sub: data.id, email: data.email, role: 'user' });
    res.status(201).json({ token, user: data });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Load with password hash; try wide first, fall back if migration missing.
    let { data: user, error } = await supabase
      .from('users')
      .select(`${USER_FIELDS_BASE}, earning_settled_at, password_hash`)
      .eq('email', email.trim().toLowerCase())
      .single();
    if (error && isMissingSettledColumn(error)) {
      warnMissingColumnOnce();
      ({ data: user, error } = await supabase
        .from('users')
        .select(`${USER_FIELDS_BASE}, password_hash`)
        .eq('email', email.trim().toLowerCase())
        .single());
    }

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
  const user = await loadUser(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const settled = await settleEarnings(user);
  res.json({ user: settled });
});

router.patch('/me/earning', requireUser, async (req, res) => {
  const wantActive = Boolean(req.body?.active);

  const current = await loadUser(req.user.id);
  if (!current) return res.status(404).json({ error: 'User not found' });

  // Settle any pending accrual before flipping the switch.
  let working = current;
  if (current.earning_active && 'earning_settled_at' in current) {
    working = await settleEarnings(current);
  }

  // Build patch: try the wide patch (with timestamps) first; fall back to
  // just earning_active if the column doesn't exist yet.
  const widePatch = { earning_active: wantActive };
  if ('earning_settled_at' in current) {
    widePatch.earning_settled_at = wantActive ? new Date().toISOString() : null;
  }

  let { data, error } = await supabase
    .from('users')
    .update(widePatch)
    .eq('id', working.id)
    .select(`${USER_FIELDS_BASE}, earning_settled_at`)
    .single();

  if (error && isMissingSettledColumn(error)) {
    warnMissingColumnOnce();
    ({ data, error } = await supabase
      .from('users')
      .update({ earning_active: wantActive })
      .eq('id', working.id)
      .select(USER_FIELDS_BASE)
      .single());
  }

  if (error) {
    console.error('Toggle earning failed:', error.message);
    return res.status(500).json({ error: 'Update failed' });
  }
  res.json({ user: data });
});

export default router;
