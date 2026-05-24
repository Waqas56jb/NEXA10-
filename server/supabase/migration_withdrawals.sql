-- ─── WITHDRAWALS ─────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- snapshot of user identity at request time (audit / reporting)
  user_email TEXT NOT NULL,
  user_username TEXT NOT NULL,
  -- amount in USDT (balance currency)
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  -- destination bank/account
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT,
  -- workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- ─── EXTEND FUND_TRANSFERS to track withdrawal-related debits/refunds ────
ALTER TABLE fund_transfers DROP CONSTRAINT IF EXISTS fund_transfers_source_check;
ALTER TABLE fund_transfers
  ADD CONSTRAINT fund_transfers_source_check
  CHECK (source IN ('admin', 'deposit', 'system', 'withdrawal'));

ALTER TABLE fund_transfers
  ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fund_transfers_withdrawal_id ON fund_transfers(withdrawal_id);
