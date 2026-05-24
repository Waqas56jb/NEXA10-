# NEXA10 Backend Server

Node.js + Express API with Supabase PostgreSQL database.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/schema.sql`
3. Copy from **Project Settings → API**:
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 2. Server

```bash
cd server
cp .env.example .env
# Edit .env with your Supabase credentials

npm install
npm run seed    # Creates default admin
npm run dev     # Starts on http://localhost:5000
```

**Default admin** (after seed):
- Email: `admin@nexa10.com`
- Password: `Admin@123456`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_USE_LOCAL_STORAGE=false (uses API)
# VITE_API_URL= (empty — Vite proxies /api to :5000)

npm run dev
```

Admin panel: http://localhost:5173/admin/login

---

## API Reference

### Health
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | No |

### Admin Auth
| Method | Path | Body |
|--------|------|------|
| POST | `/api/admin/auth/login` | `{ email, password }` |
| GET | `/api/admin/auth/me` | Bearer admin token |
| POST | `/api/admin/auth/forgot-password` | `{ email }` |
| POST | `/api/admin/auth/reset-password` | `{ token, password }` |

### Admin Dashboard
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/stats` | Admin |

### Admin Users
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| PATCH | `/api/admin/users/:id/block` | Admin `{ blocked }` |
| DELETE | `/api/admin/users/:id` | Admin |
| POST | `/api/admin/users/:id/funds` | Admin `{ type, amount, note }` |

### Deposits
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/deposits` | Optional user `{ exchange, network, email, username, amount, screenshot }` |
| GET | `/api/deposits/mine` | User |
| GET | `/api/deposits/admin/all?status=pending` | Admin |
| PATCH | `/api/deposits/admin/:id/approve` | Admin |
| PATCH | `/api/deposits/admin/:id/reject` | Admin |

### Notifications
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/notifications` | Public (active only) |
| GET | `/api/notifications/admin/all` | Admin |
| POST | `/api/notifications/admin` | Admin `{ text }` |
| PATCH | `/api/notifications/admin/:id` | Admin `{ active, text }` |
| DELETE | `/api/notifications/admin/:id` | Admin |

### Customer Auth
| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/register` | `{ email, username, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | Bearer user token |
| PATCH | `/api/auth/me/earning` | `{ active }` |

### Transfers
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/transfers/mine` | User |

---

## Database Tables

| Table | Description |
|-------|-------------|
| `admins` | Admin accounts + password reset tokens |
| `users` | Customer accounts, balances |
| `deposits` | Deposit requests with screenshots |
| `fund_transfers` | Incoming/outgoing fund history |
| `notifications` | Platform announcements |
| `settings` | App configuration key-value store |
