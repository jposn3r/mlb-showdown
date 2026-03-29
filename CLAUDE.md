# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based implementation of MLB Showdown (Wizards of the Coast, 2000–2005) — a collectible card and dice game. Full Expert rules, 4 game modes, 30-team franchise mode, pack drafting, all persisted to localStorage. See `PLAN.md` for the complete specification.

## Tech Stack

React 18 + Vite + TypeScript, Tailwind CSS v3, Zustand (state + localStorage persistence + screen navigation), Framer Motion (animations), Howler.js (audio), CSS 3D (dice/cards). No router — navigation is Zustand screen state. Deployed to Vercel.

## Commands

```bash
npm install
npm run dev          # Dev server at localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

**The core rule: game logic is pure TypeScript with zero React imports.**

- `src/game/` — Framework-agnostic game engine. All rules, dice, state transitions, and simulation logic live here. No React dependencies allowed.
- `src/store/` — Zustand stores (`gameStore`, `franchiseStore`, `teamStore`) with localStorage persistence middleware. These are the bridge between game logic and UI.
- `src/hooks/` — React hooks (`useGame`, `useFranchise`, `useDice`) that wrap stores. **Components must access game state through hooks only — never import from `src/game/` directly.**
- `src/screens/` — 10 top-level screens (Home, TeamBuilder, QuickPlaySelect, Game, Result, FranchiseHub, PlayoffBracket, PackDraft, SeasonAwards, Settings).
- `src/components/` — Reusable UI grouped by domain (Card/, Dice/, Diamond/, Scoreboard/, GameBoard/, Franchise/, PackDraft/, UI/).
- `src/data/` — Card definitions (pitchers, batters, strategy cards) and team presets. 20 pitchers + 40 batters with real 1–20 outcome charts.

## Core Game Mechanic

Every at-bat resolves as: pitcher's team rolls d20 + pitcher.control → compare to batter.onBase → if pitch >= onBase, use pitcher's chart; if pitch < onBase, use batter's chart (ties go to pitcher) → batter's team rolls d20 → look up result on the winning chart (1–20 mapping to SO/BB/1B/2B/3B/HR/GB/FB/DP). Pitcher fatigue subtracts 1 from pitch roll per inning beyond their IP rating. Stolen bases are attempted before the pitch roll (d20 vs speed threshold: A=8+, B=12+, C=16+). DP with no runner on 1st is treated as GB. Extra innings use standard rules (no ghost runner).

## Key Engine Files

- `engine.ts` — Pitch resolution, advantage calculation, chart lookup, result application
- `stateMachine.ts` — Game phase transitions, inning logic, out counting, extra innings
- `simulation.ts` — Headless CPU vs CPU games using the same engine (not fake scores)
- `franchiseEngine.ts` — Season simulation, standings, schedule generation, award calculations
- `src/audio/soundEngine.ts` — Howler.js wrapper, `useSound()` hook for all game audio

## Visual Design

"Stadium Night" aesthetic: dark shell (#0d0f14), gold accents (#c9a84c). Cards must faithfully replicate real MLB Showdown cards — cream face, team color borders, monospace stat blocks, foil shimmer on rares via CSS gradient animation. Scoreboard uses amber dot-matrix style.

## Responsive Breakpoints

- <640px: Cards stacked vertically, bottom score strip, horizontal strategy hand scroll
- 640–1024px: Cards side by side, diamond below
- 1024px+: Three-column game board (pitcher | diamond | batter)

## Build Phases

The project follows 13 sequential phases (0–12) defined in PLAN.md. Phase 0 is the data pipeline (Python script generating card data from MLB Stats API). Phase 1 (pure game engine) must be console-verified before any UI work begins. Each phase builds on the previous — don't skip ahead. See `ROSTER_AND_STATS.md` for the complete data pipeline spec.

## Important Rules

- Pitcher/batter cards have different layouts — keep as separate component branches, not conditionals
- No SP can start consecutive games in franchise mode (always enforced, not optional)
- CPU simulations use the real engine — same dice, same charts, same rules
- All state auto-persists to localStorage via Zustand middleware; no manual save calls
- Strategy cards (20 total) each have unique handlers in `strategy.ts`; hand starts at 3, draw 1 per half-inning, max 5
- Franchise supports 3 start modes: preset team, pack draft (10 packs × 8 cards), or team builder (5000 pt budget)
- Playoffs: 6 division winners (seeded 1–6) + 2 wild cards (seeded 7–8), best-of-5 each round
- CPU difficulty: Easy (random)/Medium (sensible)/Hard (optimal) — affects strategy card play, stealing, pitching changes
- All card data generated from real MLB stats via `scripts/generate-cards.py`; 20 cards per team, ~600 total
