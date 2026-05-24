import 'dotenv/config';
import app from './app.js';
import { dbConfigured } from './config/supabase.js';

const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.listen(PORT, () => {
  console.log(`\n🚀 NEXA10 API running on http://localhost:${PORT}`);
  console.log(`   CORS origins: ${CORS_ORIGINS.join(', ')}`);
  console.log(`   Database: ${dbConfigured() ? 'Supabase connected' : '⚠ Missing SUPABASE env vars'}\n`);
});
