# NEXA10 Admin Panel

Standalone React admin app — separate from the customer `frontend/`.

## Routes

| Route | Page |
|-------|------|
| `/login` | Admin sign in |
| `/forgot-password` | Request password reset |
| `/reset-password?token=...` | Set new password |
| `/` | Dashboard |
| `/users` | User management |
| `/deposits` | Deposit approvals |
| `/notifications` | Announcements |

## Development

```bash
cd admin
npm install
cp .env.example .env
npm run dev
```

Runs on **http://localhost:5174** (proxies `/api` → backend on `:5000`).

Start the API first:

```bash
cd server && npm run dev
```

**Login:** `admin@nexa10.com` / `Admin@123456`

## Production build

```bash
npm run build
npm run preview
```

Deploy as a separate Vercel project with root directory `admin/`.
