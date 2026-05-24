-- ─── CUSTOMER SUPPORT (cases + messages) ────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

CREATE TABLE IF NOT EXISTS support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Support request',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  -- denormalized fields for fast inbox rendering
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sender TEXT CHECK (last_sender IN ('user', 'admin')),
  unread_for_admin BOOLEAN NOT NULL DEFAULT TRUE,
  unread_for_user BOOLEAN NOT NULL DEFAULT FALSE,
  -- audit
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  close_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce: a user can have at most ONE 'open' case at a time.
-- (Closed cases can pile up freely as history.)
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_cases_one_open_per_user
  ON support_cases (user_id) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_support_cases_user_id ON support_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_last_message_at ON support_cases(last_message_at DESC);

ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;

-- ─── MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES support_cases(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin', 'system')),
  -- sender_id is the user.id or admin.id; null for 'system' notices
  sender_id UUID,
  text TEXT,
  -- screenshot stored as base64 data URL (caller-side compressed to <500KB)
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (text IS NOT NULL OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_support_messages_case_id ON support_messages(case_id, created_at);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
