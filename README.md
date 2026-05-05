# BrawlLens

Advanced analytics for competitive Brawl Stars players.

## Features

- **Player Lookup** — Search any player tag to view trophies, battle history, and brawler roster
- **Leaderboards** — Top 200 players, clubs, and brawlers by region, updated every 30 minutes
- **Brawler Catalog** — Browse all brawlers with rarity filtering, win rates, and rankings
- **Maps** — Browse active and recent maps with pick/win rate meta data
- **AI Chat** — Ask anything about players, brawlers, maps, and clubs in natural language

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

BrawlLens uses Supabase Auth for sessions. To send magic links from a BrawlLens-owned sender instead of Supabase's default email service, configure:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
RESEND_API_KEY=...
AUTH_EMAIL_FROM="BrawlLens <login@yourdomain.com>"
AUTH_EMAIL_REPLY_TO="support@yourdomain.com"
```

If those email variables are missing, the app falls back to Supabase's built-in magic-link email.

## Disclaimer

Not affiliated with or endorsed by Supercell.
