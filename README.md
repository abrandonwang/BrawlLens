# BrawlLens

Advanced analytics for competitive Brawl Stars players.

## Features

- **Player Lookup** - Search any player tag to view trophies, battle history, and brawler roster
- **Leaderboards** - Top 200 players, clubs, and brawlers by region, updated every 30 minutes
- **Brawler Catalog** - Browse all brawlers with rarity filtering, win rates, and rankings
- **Maps** - Browse active and recent maps with pick/win rate meta data
- **AI Chat** - Ask anything about players, brawlers, maps, and clubs in natural language

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase for data storage; self-hosted proxy for Brawl Stars API access
- Battle collector running on DigitalOcean via PM2

## Getting Started

```bash
npm install
npm run dev
```

## Auth Email

BrawlLens uses Supabase Auth for sessions and password storage, but account setup emails must be sent through the BrawlLens-owned sender. Configure:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
RESEND_API_KEY=...
AUTH_EMAIL_FROM="BrawlLens <login@yourdomain.com>"
AUTH_EMAIL_REPLY_TO="support@yourdomain.com"
AUTH_REDIRECT_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

If those email variables are missing, account creation returns `custom_email_not_configured` instead of falling back to Supabase's built-in confirmation email.

`AUTH_REDIRECT_BASE_URL` is used first for auth/setup links in BrawlLens-owned emails. `NEXT_PUBLIC_BASE_URL` is a client-safe fallback for public URLs. If none of the base URL environment variables are configured, auth emails default to `https://brawllens.com` instead of local origin.

In Supabase, also add the same production setup URL under Authentication -> URL Configuration -> Redirect URLs:

```txt
https://yourdomain.com/auth/setup
```

Restart the Next.js dev server after changing `.env.local` so the new sender config is loaded.

Signup also rejects disposable email domains and domains without mail DNS records before creating an account.

## Disclaimer

Not affiliated with or endorsed by Supercell.
