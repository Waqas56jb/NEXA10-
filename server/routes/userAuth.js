import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

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
      .select('id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at')
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
      .select('id, email, username, password_hash, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at')
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
    const token = signToken({ sub: user.id, email: user.email, role: 'user' });
    res.json({ token, user });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireUser, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, balance, deposit_total, earnings_total, blocked, ref_code, earning_active, created_at')
    .eq('id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json({ user: data });
});

router.patch('/me/earning', requireUser, async (req, res) => {
  const { active } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ earning_active: Boolean(active) })
    .eq('id', req.user.id)
    .select('earning_active')
    .single();

  if (error) return res.status(500).json({ error: 'Update failed' });
  res.json({ earning_active: data.earning_active });
});

export default router;
