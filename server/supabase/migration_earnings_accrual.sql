-- ─── EARNINGS ACCRUAL ───────────────────────────────────────────────────
-- Adds a settlement timestamp so the server can compute how much to credit
-- a user every time we read their account while earning is active.
--
-- Formula (matches Invest page calculator): 0.18% / hour on deposit_total
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS earning_settled_at TIMESTAMPTZ;

-- For users that already have earning_active = true, start the meter "now"
-- so we don't retroactively credit them for the time before this migration.
UPDATE users
SET earning_settled_at = NOW()
WHERE earning_active = TRUE
  AND earning_settled_at IS NULL;
