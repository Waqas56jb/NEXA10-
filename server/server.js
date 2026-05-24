import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { dbConfigured } from './config/supabase.js';
import adminAuthRoutes from './routes/adminAuth.js';
import userAuthRoutes from './routes/userAuth.js';
import adminUsersRoutes from './routes/adminUsers.js';
import depositsRoutes from './routes/deposits.js';
import notificationsRoutes from './routes/notifications.js';
import transfersRoutes from './routes/transfers.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'NEXA10 API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

app.use('/api', dashboardRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/auth', userAuthRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/transfers', transfersRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 NEXA10 API running on http://localhost:${PORT}`);
  console.log(`   CORS origins: ${CORS_ORIGINS.join(', ')}`);
  console.log(`   Database: ${dbConfigured() ? 'Supabase connected' : '⚠ Missing SUPABASE env vars'}\n`);
});
