import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('⚠ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in server/.env');
}

export const supabase = createClient(url || '', key || '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function dbConfigured() {
  return Boolean(url && key);
}
