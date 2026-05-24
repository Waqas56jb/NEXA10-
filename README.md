# NEXA10

AI-powered managed investment platform — React frontend with NEXA10 dark neon theme.

## Project structure

```
NEXA10-/
├── frontend/          # Customer app (users only) — port 5173
├── admin/             # Admin panel (separate app) — port 5174
├── server/            # Node.js + Express API (Supabase)
├── .gitignore
└── README.md
```

## Admin panel

Separate app in **`admin/`** — not part of the customer frontend.

| Route | Page |
|-------|------|
| `/login` | Admin sign in |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password |
| `/` | Dashboard |
| `/users` | User management |
| `/deposits` | Deposit approvals |
| `/notifications` | Announcements |

See **[admin/README.md](admin/README.md)**.

## Full stack setup (Supabase + API)

See **[server/README.md](server/README.md)** for database schema and API docs.

Quick start:

```bash
# Terminal 1 — API
cd server && npm install && npm run dev

# Terminal 2 — Customer app
cd frontend && npm install && npm run dev

# Terminal 3 — Admin panel
cd admin && npm install && npm run dev
```

- Customer site: http://localhost:5173  
- Admin panel: http://localhost:5174  
- API: http://localhost:5000  

**Admin login:** `admin@nexa10.com` / `Admin@123456`

Set `VITE_USE_LOCAL_STORAGE=true` in `frontend/.env` for offline demo mode (no backend).

## Pages

| Route | Page |
|-------|------|
| `/` | Landing |
| `/login`, `/signup`, `/reset` | Auth overlay |
| `/dashboard` | Investor dashboard |
| `/deposit` | Deposit funds |
| `/invest` | GPU plans + profit calculator |
| `/referrals` | Referral statistics |
| `/transactions` | Transaction history tabs |
| `/levels` | Referral plans |
| `/notifications` | Latest news |

## Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Production build

```bash
cd frontend
npm run build
npm run preview
```

Build output: `frontend/dist/`

## Deploy on Vercel

Your repo root is **not** the React app — the app lives in **`frontend/`**. GitHub should only show:

```
.gitignore
README.md
frontend/
vercel.json
```

If Vercel still shows old `index.html`, `dashboard.html`, or root `public/` folder, the project is using **cached settings** or the **wrong root directory**.

### Option A — Recommended (use root `vercel.json`)

Do **not** change Root Directory. Leave it **empty** (repository root `.`).

1. Push latest code to GitHub (`git push`).
2. Vercel → your project → **Settings → General**
3. **Root Directory:** leave blank / `.`
4. **Framework Preset:** Vite (or Other)
5. **Build Command:** leave empty (uses root `vercel.json`)
6. **Output Directory:** leave empty (uses root `vercel.json`)
7. **Deployments → Redeploy → check “Clear build cache”**

Root `vercel.json` runs `npm install` and `npm run build` inside `frontend/` automatically.

### Option B — Root Directory = `frontend`

1. **Settings → General → Root Directory** → set to `frontend` → Save
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Install Command:** `npm install`
5. Redeploy with **Clear build cache**

When Root Directory is `frontend`, the file picker should only show the React app (no old HTML at repo root).

### Still seeing old files?

1. Confirm GitHub: open your repo on github.com — root should **not** have `index.html`.
2. Vercel → **Settings → Git** → disconnect and reconnect the repo, or create a **new Vercel project** from the same GitHub repo.
3. Always redeploy with **Clear build cache**.


## Stack

- React 19
- React Router
- Vite
