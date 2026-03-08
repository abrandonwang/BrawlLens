# BrawlLens

**Track your progress. Master your picks.**

BrawlLens is a full-stack Brawl Stars companion app that lets players track their brawler progression, view account completion stats, and (coming soon) get AI-powered draft recommendations.

## Features

- **Player Lookup** — Enter any player tag to pull real-time stats from the Brawl Stars API
- **Brawler Roster** — View all your brawlers with power levels, trophies, gadgets, star powers, gears, and hypercharges
- **Progression Tracking** — See how far you are from maxing your account by comparing your unlocks against the full brawler catalog
- **AI Draft Picker** *(planned)* — Get team composition recommendations based on map, mode, and brawler matchups

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom CSS
- **API:** Brawl Stars Official API
- **Font:** Inter

## Getting Started

### Prerequisites

- Node.js 18+
- A Brawl Stars API key from [developer.brawlstars.com](https://developer.brawlstars.com)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/brawl-tracker.git
   cd brawl-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root:
   ```
   BRAWL_API_KEY=your_api_key_here
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── brawlers/route.ts    # Proxy → Brawl Stars brawler catalog
│   │   └── player/route.ts      # Proxy → Brawl Stars player data
│   ├── player/[tag]/page.tsx    # Dynamic player profile page
│   ├── layout.tsx               # Root layout with navbar
│   ├── globals.css              # Global styles and theme
│   └── page.tsx                 # Homepage with search
├── components/
│   ├── BrawlerCard.tsx          # Individual brawler display card
│   ├── NavBar.tsx               # Site navigation
│   ├── NavBar.css
│   └── ScrambleText.tsx         # Animated placeholder text effect
└── types/
    └── brawler.ts               # TypeScript interfaces for API data
```

## API Routes

The app proxies all Brawl Stars API requests through Next.js API routes to keep the API key secure and avoid CORS issues.

| Route | Description |
|---|---|
| `GET /api/brawlers` | Returns the full brawler catalog |
| `GET /api/player?tag=TAG` | Returns player data for the given tag |

## Roadmap

- [ ] Styled player profile page with tabs
- [ ] Brawler completion tracker (owned vs available)
- [ ] Account progression percentage
- [ ] Club member viewer
- [ ] AI-powered draft picker
- [ ] Brawler images and rarity colors
- [ ] Mobile-optimized brawler grid

## License

This project is not affiliated with or endorsed by Supercell.