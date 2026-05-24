import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = (process.env.ADMIN_EMAIL || 'admin@nexa10.net').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const name = process.env.ADMIN_NAME || 'Super Admin';

  if (password.length < 8) {
    console.error('✗ ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: existing, error: lookupErr } = await supabase
    .from('admins')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (lookupErr) {
    console.error('✗ Lookup failed:', lookupErr.message);
    process.exit(1);
  }

  if (existing) {
    const { error } = await supabase
      .from('admins')
      .update({
        password_hash,
        name,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('✗ Update failed:', error.message);
      process.exit(1);
    }
    console.log('\n✓ Admin credentials updated');
  } else {
    const { error } = await supabase.from('admins').insert({
      email,
      password_hash,
      name,
    });

    if (error) {
      console.error('✗ Insert failed:', error.message);
      process.exit(1);
    }
    console.log('\n✓ Admin created');
  }

  console.log('─────────────────────────────────');
  console.log('  Email    :', email);
  console.log('  Password :', password);
  console.log('  Name     :', name);
  console.log('─────────────────────────────────');
  console.log('Sign in at the admin panel (default: http://localhost:5174/login)\n');
}

run().catch((err) => {
  console.error('✗ Unexpected error:', err.message);
  process.exit(1);
});
