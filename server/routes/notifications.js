import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';

const router = Router();

// Public / customer — active notifications only
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, text, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data });
});

// Admin — all notifications
router.get('/admin/all', requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data });
});

router.post('/admin', requireAdmin, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

  const { data, error } = await supabase
    .from('notifications')
    .insert({ text: text.trim(), active: true, created_by: req.admin.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ notification: data });
});

router.patch('/admin/:id', requireAdmin, async (req, res) => {
  const { active, text } = req.body;
  const patch = {};
  if (typeof active === 'boolean') patch.active = active;
  if (text) patch.text = text.trim();

  const { data, error } = await supabase
    .from('notifications')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notification: data });
});

router.delete('/admin/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('notifications').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

export default router;
