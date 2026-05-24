import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name, password_hash')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await supabase.from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id);

    const token = signToken({ sub: admin.id, email: admin.email, role: 'admin' });

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, name, last_login_at, created_at')
    .eq('id', req.admin.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Admin not found' });
  res.json({ admin: data });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalized = email.trim().toLowerCase();
    const { data: admin } = await supabase
      .from('admins')
      .select('id, email')
      .eq('email', normalized)
      .single();

    // Always return success to prevent email enumeration
    if (!admin) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase
      .from('admins')
      .update({ reset_token: token, reset_token_expires: expires })
      .eq('id', admin.id);

    const resetUrl = `${process.env.ADMIN_APP_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5174'}/reset-password?token=${token}`;

    res.json({
      message: 'If that email exists, a reset link has been sent.',
      // Dev only — remove in production when email service is connected
      ...(process.env.NODE_ENV !== 'production' && { resetUrl, token }),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Request failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (error || !admin) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (new Date(admin.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const password_hash = await hashPassword(password);

    await supabase
      .from('admins')
      .update({
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', admin.id);

    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;
