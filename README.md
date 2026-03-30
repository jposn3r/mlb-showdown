# MLB Showdown Web

A browser-based implementation of the MLB Showdown collectible card and dice game (originally by Wizards of the Coast, 2000-2005).

## Features

- **Full Expert Ruleset** — d20 pitch/swing mechanic, pitcher fatigue, stolen bases, auto double plays
- **Real MLB Data** — 600+ player cards generated from 2025 MLB season stats via the MLB Stats API
- **30 MLB Teams** — Complete rosters with real player headshots, stats, and outcome charts
- **Franchise Mode** — 30-team league with schedule, standings, roster management, stat tracking, and day-by-day season progression (10/30/50 game seasons)
- **Interactive Gameplay** — Roll dice, see advantage calculations, watch runners advance on the diamond
- **Dark Theme UI** — Stadium Night aesthetic with gold accents

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Zustand (state management)
- Framer Motion (animations)
- Howler.js (audio, planned)

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click Quick Play to start a game.

## Regenerate Card Data

Card data is generated from the MLB Stats API. To regenerate with fresh stats:

```bash
pip install requests
python scripts/generate-cards.py --season 2025
```

## How to Play

1. **Pick two teams** from the Quick Play screen
2. **Roll "The Pitch"** — d20 + pitcher's Control vs batter's On-Base number
3. If pitch total >= On-Base: **Pitcher Advantage** (swing looked up on pitcher's chart)
4. If pitch total < On-Base: **Batter Advantage** (swing looked up on batter's chart)
5. **Roll "The Swing"** — result looked up on the advantage card's outcome chart (1-20)
6. Play through 9 innings (extra innings if tied)

## Project Structure

- `src/game/` — Pure TypeScript game engine (no React dependencies)
- `src/store/` — Zustand state stores
- `src/components/` — React UI components (Card, Dice, Diamond, Scoreboard, GameBoard)
- `src/screens/` — Top-level screens (Home, QuickPlay, Game, Result, FranchiseSetup, FranchiseHub, FranchiseResult)
- `src/data/` — Generated card data for all 30 MLB teams
- `scripts/` — Data pipeline and test scripts

See `PLAN.md` for the full project specification and `CLAUDE.md` for development guidance.
