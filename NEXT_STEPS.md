# Next Steps

What's been done and what's left to build.

---

## Completed

### Phase 0 — Data Pipeline
- [x] `scripts/generate-cards.py` pulls rosters + stats from MLB Stats API (2025 season)
- [x] Stat-to-card conversion: OBP → onBase, BB/9 → control, SB → speed, etc.
- [x] Outcome chart generation (1–20) for all players based on real stats
- [x] 600+ cards across all 30 MLB teams (20 per team: 5 SP, 3 RP, 9 starters, 3 bench)
- [x] Rarity assignment based on point values (common/uncommon/rare/foil)
- [x] Team metadata with divisions, colors, logos
- [x] TypeScript types file (`src/types.ts`)

### Phase 1 — Game Engine Core
- [x] `dice.ts` — d20 roll with seedable RNG
- [x] `engine.ts` — pitch resolution, advantage (ties go to pitcher), chart lookup
- [x] `baserunning.ts` — runner advancement for all result types + stolen bases
- [x] `fatigue.ts` — IP-based pitch roll penalties
- [x] `stateMachine.ts` — full game state management, innings, outs, extra innings (standard rules)
- [x] `simulation.ts` — headless CPU vs CPU game simulation
- [x] Auto double play: GB with runner on 1st and <2 outs (no DP on charts)
- [x] Console-verified with 10-game Yankees vs Dodgers series

### Phase 2 — Card Component
- [x] `PlayerCard.tsx` — dark theme, MLB silo headshots, team color border
- [x] Separate pitcher layout (Control/IP) vs batter layout (On-Base/Speed)
- [x] `OutcomeChart.tsx` — grouped ranges with full result names, active roll highlight
- [x] Foil shimmer CSS animation on rare cards
- [x] Rarity border glow

### Phase 3 — Dice Component
- [x] `DiceRoller.tsx` — click to roll with spin animation
- [x] Result coloring (green for hits, red for outs, gold for HR)
- [x] Disabled state between phases

### Phase 4 — Game Board + Core Loop (partial)
- [x] `GameBoard.tsx` — three-column layout (away | diamond+dice | home)
- [x] Team-anchored layout: away always left, home always right, roles swap each half-inning
- [x] `BaseballDiamond.tsx` — SVG diamond with runner headshots on bases
- [x] `Scoreboard.tsx` — inning-by-inning scores, outs indicator
- [x] `GameLog.tsx` — scrollable play-by-play pinned to bottom
- [x] `OnDeck.tsx` — next 2 batters with headshot and OB number
- [x] `Bullpen.tsx` — available relief pitchers with click-to-sub
- [x] Step-by-step pitch/swing UX with advantage explanation
- [x] Zustand game store wiring
- [x] Screen navigation (Home → Quick Play → Game → Result)

### App Scaffolding
- [x] Vite + React 18 + TypeScript
- [x] Tailwind CSS v4 with Stadium Night theme (CSS custom properties)
- [x] Zustand screen store (no router)
- [x] Zero type errors, production build works

---

## Not Yet Started

### Phase 4 — Remaining Items
- [ ] Stolen base UI (button to attempt steal before pitch, with speed check)
- [ ] Pitching change confirmation dialog
- [ ] Mobile responsive layout (cards stack vertically, score strip at bottom)
- [ ] Fatigue bar visual on pitcher card (green → yellow → red)

### Phase 5 — Strategy Cards
- [ ] `StrategyCard.tsx` — card design (offense/defense/utility types)
- [ ] `StrategyHand.tsx` — fan of cards, tap to select + confirm
- [ ] `strategy.ts` — all 20 strategy card effect handlers
- [ ] `strategyCards.ts` — card definitions data
- [ ] Hand management: start with 3, draw 1 per half-inning, max 5
- [ ] Shared deck, shuffle, discard pile

### Phase 6 — All Game Modes
- [ ] Quick Play: 4 hand-curated preset teams (Murderers Row, Ace Factory, Speed Demons, Classic 2000)
- [ ] Hot Seat: "Pass Device" screen between half-innings to hide strategy hand
- [ ] CPU AI in `cpu.ts`: strategy decisions, pitcher management, steal attempts
- [ ] CPU difficulty tiers (Easy: random, Medium: sensible, Hard: optimal)
- [ ] `simulation.ts` updates for CPU decision-making

### Phase 7 — Team Builder + Custom Cards
- [ ] `TeamBuilderScreen.tsx` — card browser + roster builder
- [ ] Filter by position, team, year, rarity
- [ ] 5000-point budget tracker
- [ ] Save/load up to 5 custom rosters
- [ ] Custom card generator with stat assignment

### Phase 8 — Franchise Foundation
- [ ] `franchiseStore.ts` with localStorage persistence
- [ ] `franchiseEngine.ts` — schedule generation, standings, CPU game simulation
- [ ] `FranchiseHubScreen.tsx` — schedule, standings, roster, leaders, awards, bracket, history
- [ ] `scheduleGenerator.ts` — random opponent assignment for 10/30/50 game seasons
- [ ] Advance Day: simulate all CPU games for that day
- [ ] 6 divisions (AL/NL East/Central/West) matching real MLB

### Phase 9 — Franchise Roster Management
- [ ] Pitcher rotation picker with mandatory rest enforcement (no consecutive starts)
- [ ] Lineup order setter
- [ ] Trade panel: mid-season window (after 40% of games), CPU accept/reject, max 3/season
- [ ] Injury system (optional toggle): pitcher IP overuse, position player consecutive games
- [ ] Aging/retirement (optional toggle): seasonsRemaining counter, free agent replacement

### Phase 10 — Pack Draft Mode
- [ ] `PackDraftScreen.tsx` — cinematic pack opening
- [ ] 10 packs × 8 cards with fan-out reveal animation
- [ ] Rarity flash per card (foil sparkle)
- [ ] `DraftBoard.tsx` — draft roster from 80-card pool
- [ ] Pack rarity distribution: 4 common, 2 uncommon, 1 rare, 1 rare-or-foil per pack
- [ ] CPU teams auto-assembled from real rosters after user drafts

### Phase 11 — Season Awards + Playoffs
- [ ] `SeasonAwardsScreen.tsx` — trophy ceremony with animated reveals
- [ ] Award formulas: MVP, Cy Young, Batting Title, HR Leader, SB Leader
- [ ] `PlayoffBracketScreen.tsx` — 8-team visual bracket
- [ ] Division-based seeding: 6 division winners (1–6) + 2 wild cards (7–8)
- [ ] Best-of-5 series per round (Divisional, Championship, World Series)
- [ ] World Series: gold borders, confetti on win
- [ ] Trophy persisted in Awards Cabinet across seasons

### Phase 12 — Polish + Responsive QA
- [ ] Source sound effects, compile into `sounds.mp3` sprite
- [ ] Wire `soundEngine.ts` + `useSound()` hook to all game events
- [ ] Responsive QA: iPhone SE (320px), iPhone 14 (390px), iPad (768px), 1280px, 1440px
- [ ] Performance: lazy-load screens, memoize card renders, 60fps dice on mobile
- [ ] Accessibility: keyboard nav, ARIA labels
- [ ] Settings screen: animation speed, sound toggle, injury toggle, aging toggle, reset data
- [ ] localStorage stress test with large multi-season franchise saves

---

## Data Pipeline Improvements
- [ ] Regenerate cards with DP removed from charts (run `generate-cards.py` again)
- [ ] Download headshot images locally for offline play (`public/images/players/`)
- [ ] Historic season support: `--season 2000` for classic card sets
- [ ] Validate chart distributions: ensure no chart has 0 outs or 0 ways to reach base
- [ ] Team color accuracy pass (verify all 30 team hex values)

## Future Expansions
- [ ] 2000 Classics set (Bonds, Pedro, Jeter, Griffey era)
- [ ] 2010s Stars set (Trout, Kershaw, Altuve, Betts)
- [ ] All-Time Legends set (Ruth, Aaron, Mays — manual data or Baseball Reference)
- [ ] Vercel deployment
- [ ] Multiplayer via WebSocket (stretch goal)
