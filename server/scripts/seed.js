import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@nexa10.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const { data: existing } = await supabase.from('admins').select('id').eq('email', email).maybeSingle();
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { error } = await supabase.from('admins').insert({
    email,
    password_hash,
    name: 'Super Admin',
  });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log('✓ Admin created');
  console.log('  Email:', email);
  console.log('  Password:', password);
}

seed();
