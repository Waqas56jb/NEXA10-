# NEXA10

AI-powered managed investment platform — React frontend with NEXA10 dark neon theme.

## Project structure

```
NEXA10-/
├── frontend/          # React + Vite application
├── .gitignore
└── README.md
```

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

## Deploy

Point your hosting (Vercel, Netlify, GitHub Pages, etc.) to the **`frontend`** folder:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

For SPA routing, add a fallback to `index.html` for all routes.

## Stack

- React 19
- React Router
- Vite
