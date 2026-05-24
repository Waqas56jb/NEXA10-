-- Run in Supabase SQL Editor if deposits table already exists
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS approved_amount NUMERIC(18, 2);
