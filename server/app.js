import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import adminAuthRoutes from './routes/adminAuth.js';
import userAuthRoutes from './routes/userAuth.js';
import adminUsersRoutes from './routes/adminUsers.js';
import depositsRoutes from './routes/deposits.js';
import withdrawalsRoutes from './routes/withdrawals.js';
import notificationsRoutes from './routes/notifications.js';
import transfersRoutes from './routes/transfers.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// Public API: reflect any Origin back to the caller and allow credentials.
// (`origin: true` reflects the request's Origin header — required when
// credentials: true is set, since '*' is not allowed with credentials.)
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Make sure the preflight always returns 204 even if no downstream route matches
app.options('*', cors(corsOptions));
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
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/transfers', transfersRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
