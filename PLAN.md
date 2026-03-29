# MLB Showdown Web — Project Plan

## Project Overview

A fully faithful web-based implementation of the MLB Showdown collectible card and dice game (Wizards of the Coast, 2000–2005). Full Expert rules, animated 3D d20, four game modes, franchise mode with 30 teams across multiple seasons, pack-draft team building, and a card collection system — all persisted to localStorage. Built for desktop and mobile.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 + CSS custom properties for card theming |
| State | Zustand + localStorage persistence middleware |
| Navigation | Zustand screen state (no router — video game menu feel) |
| Animation | Framer Motion (card reveals, dice roll, base transitions, pack opening) |
| Audio | Howler.js (sound sprites, volume control, mobile unlock) |
| Dice | Custom CSS 3D d20 component (clip-path + transform) |
| Fonts | Display: `Playfair Display` or `DM Serif Display` / UI: `IBM Plex Sans` |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Visual Direction

**Aesthetic: Stadium Night — Modern UI shell, authentic retro card design**

- App shell: near-black background (`#0d0f14`), gold accents (`#c9a84c`), white text, deep navy dividers
- Card design: faithful to actual MLB Showdown cards — cream/off-white card face, MLB team color borders, era-accurate typography, monospace stat blocks, foil shimmer via CSS gradient animation on rare cards
- Dice: 3D CSS icosahedron that physically spins and settles, face shows result number
- Baseball diamond: top-down SVG field with animated runner tokens
- Scoreboard: amber dot-matrix font, classic stadium LED style
- Franchise Hub: dark wood texture, trophy case aesthetic, manager's office feel
- Pack opening: cinematic reveal — pack art shown, cards fan out one by one with rarity flash
- Mobile: card-first layout, large dice tap target, scoreboard collapses to persistent bottom bar

---

## Screen Architecture (10 Screens)

Navigation is managed via Zustand screen state — no URL routing. Screens transition like a video game menu system.

### 1. Home Screen
Full-bleed dark landing. Large "MLB Showdown" wordmark in display serif with gold underline. Mode cards in 2x2 grid plus Franchise below: Quick Play, Hot Seat, vs CPU, Team Builder, Franchise. "Continue" button appears at top if an active game or franchise is saved. Settings icon bottom-right.

### 2. Team Builder Screen
Two-panel layout. Left: card browser — filterable grid by position, team, year, rarity. Right: active roster — 9 lineup slots + pitching staff (5 SP, 3 RP), live budget bar (pts used / 5000). Drag card to roster slot to add. Budget bar turns red if over cap. Save up to 5 custom rosters. Custom card generator: enter name, stats, assign chart values, pick team color. Mobile: tabbed Browse / Roster.

### 3. Quick Play — Team Select Screen
Two columns, one per player/side. Pick from 4 preset teams or any saved custom roster. Team card shows name, star players, overall rating. Animated coin flip to determine home/away. Transitions directly into Game Screen.

### 4. Game Screen
The main event. Full layout:

```
┌──────────────────────────────────────────────────┐
│  TOP BAR: Inning (T/B indicator) + 3 out dots     │
├────────────┬─────────────────────┬───────────────┤
│ PITCHER    │   BASEBALL          │  BATTER       │
│ CARD       │   DIAMOND (SVG)     │  CARD         │
│            │                     │               │
│ fatigue    │  [ ROLL d20 ]       │  OB # + speed │
│ bar        │                     │  badge        │
├────────────┴─────────────────────┴───────────────┤
│  GAME LOG — scrollable play-by-play text feed     │
├───────────────────────────────────────────────────┤
│  STRATEGY HAND — fan of 3 cards, draw on half-inn │
├───────────────────────────────────────────────────┤
│  BOTTOM BAR: Away [0] — Home [0]  |  Pitching btn │
└───────────────────────────────────────────────────┘
```

- Dice animates in center of diamond area on roll (~1.2s spin + settle)
- Outcome banner slides in from top: "SINGLE!", "STRIKEOUT", "HOME RUN!" with escalating intensity
- Runner tokens animate along base paths on every result
- Fatigue bar depletes as pitcher exceeds IP, color shifts green to yellow to red
- Pitching change button available between at-bats (opens bullpen picker)
- Hot seat mode: strategy hand is hidden behind a "Pass Device" screen between half-innings
- Mobile: cards stack vertically, diamond sandwiched between, strategy hand scrolls horizontally

### 5. Result Screen
Final score large and centered. Classic box score grid below (innings across top, R/H/E bottom row). Game highlights section pulled from log (HRs, big strikeouts, strategy card plays, stolen bases). Buttons: Rematch, Back to Menu. In Franchise mode becomes "Game Summary" — shows result, updated season record, and advances franchise schedule before returning to Franchise Hub.

### 6. Franchise Hub Screen
Persistent home base for a franchise run. Manager's office aesthetic — dark background, gold trim, trophy shelf visible in corner. Six sections:

- **Schedule**: full season game list. Each row: opponent team logo, result (W/L with score) or "Play" button. Click any completed game for full box score.
- **Standings**: 30-team table with W, L, PCT, GB, RS, RA, Diff. Sortable. Top 8 highlighted as playoff contenders. Organized by division (AL East/Central/West, NL East/Central/West).
- **Your Roster**: active lineup + pitching rotation. Shows pitcher rest status (available / needs rest), injury flags if enabled.
- **Season Leaders**: live leaderboard for OBP, HR, SB, ERA equivalent, SO — updates after every game including CPU simulations.
- **Awards Cabinet**: end-of-season awards + historical trophies. World Series rings displayed prominently.
- **Playoff Bracket**: locked until regular season ends. Reveals seeded bracket and fills in as series complete.
- **History**: all-time franchise record, past champions, career stat leaders.

### 7. Playoff Bracket Screen
Full-width visual bracket. 8 teams: 6 division winners + 2 wild cards. Division winners seeded 1–6 by record, wild cards seeded 7–8. Three rounds: Divisional (best-of-5), Championship (best-of-5), World Series (best-of-5). Each matchup shows team logos, series record, and "Play Next Game" button. CPU series simulate game by game with box score summaries available. World Series gets gold border treatment and confetti/fireworks on win.

### 8. Pack Draft Screen (Franchise Start Mode)
Cinematic pack opening experience. User opens 10 packs (8 cards each = 80 total cards). Each pack opens with a fan-out reveal animation — cards flip face-down to face-up one at a time, rarity flash for uncommon/rare/foil. After all packs opened, user drafts active roster from the full 80-card pool: fill 5 SP, 3 RP, 9 position player slots + bench. Undrafted cards go to bench/trade pool.

### 9. Season Awards Screen
Appears at end of each regular season before playoffs unlock. Trophy ceremony aesthetic. Animated card reveals for each award winner with stat line shown: MVP, Cy Young, Batting Title, HR Leader, SB Leader. Transitions to playoff seeding announcement.

### 10. Settings Screen
Overlay modal. Toggles: dice animation speed (Fast / Normal / Cinematic), sound effects, injuries/rest mechanics, aging/retirement. Reset franchise data (with confirmation). Rules reference link.

---

## Game Rules: Full Expert Implementation

### Core At-Bat Loop

```
1. Pitcher's team rolls d20 → "The Pitch"
   pitch_result = die_roll + pitcher.control
   (subtract 1 per inning beyond pitcher.ip if fatigued)

2. Compare pitch_result vs batter.onBase
   - pitch_result >= batter.onBase → PITCHER ADVANTAGE → use pitcher's chart
   - pitch_result < batter.onBase  → BATTER ADVANTAGE  → use batter's chart

3. Batter's team rolls d20 → "The Swing"
   Look up roll on the advantage card's outcome chart (1–20)

4. Apply result: SO, BB, 1B, 2B, 3B, HR, GB, FB, DP
5. Advance baserunners per result type
6. Repeat until 3 outs → switch sides → next half-inning
7. 9 innings (extra innings on tie) → final score
```

### Pitcher Fatigue

- Each pitcher card has an `IP` rating (innings effective at full strength)
- Beyond IP: subtract 1 from pitch roll per inning over the limit
- **Franchise rule (always enforced):** no SP can start consecutive games
- Fatigue bar on card face depletes live, shifts green to yellow to red
- Relievers have lower IP (1–2) but start fresh each game

### Handedness

- Each card has `throws: R | L` and `bats: R | L | S`
- Strategy cards reference handedness matchups
- Switch hitters always use their favorable side

### Baserunning

| Result | Runner Advancement |
|---|---|
| Single (1B) | All runners advance 1 base |
| Double (2B) | All runners advance 2 bases |
| Triple (3B) | All runners score |
| Home Run (HR) | All runners + batter score |
| Walk (BB) | Force advance only |
| Ground Ball (GB) | Batter out; runners on 2nd/3rd advance, runner on 1st holds |
| Fly Ball (FB) | Batter out; runners hold |
| Double Play (DP) | Two outs if runner on 1st; otherwise treated as GB |

### Stolen Bases

- Attempted before the pitch roll (player chooses to try)
- Roll d20 vs threshold based on runner's speed:
  - **Speed A:** 8+ succeeds
  - **Speed B:** 12+ succeeds
  - **Speed C:** 16+ succeeds
- Failure = runner is out (counts as an out for the inning)
- Only one steal attempt per at-bat

### Extra Innings

Standard play — no ghost runners. Game continues with normal rules until one team leads at the end of a complete inning.

### Strategy Cards (20 cards)

Each team starts with 3 cards. Draw 1 at the start of each half-inning. Max hand size of 5 (discard if over). Single shared deck of all 20 card types, shuffled.

| Card | Type | Effect |
|---|---|---|
| Pep Talk | Utility | Draw cards equal to run deficit |
| Mound Conference | Defense | Force re-roll of current pitch die |
| Hit and Run | Offense | Runners advance extra base on single |
| Steal | Offense | Attempt stolen base via speed check |
| Balk | Offense | All runners advance 1 base |
| Intentional Walk | Defense | Skip batter, advance to 1B |
| Double Switch | Defense | Swap pitcher + position player |
| Pinch Hit | Offense | Substitute batter mid at-bat |
| Pinch Run | Offense | Substitute faster baserunner |
| Squeeze Play | Offense | Score runner from 3B on next result |
| Brushback | Defense | Force batter re-roll swing die |
| Rally Cap | Utility | Re-roll any single die result once |
| Pitching Change | Defense | Swap pitcher between at-bats |
| Strikeout Artist | Defense | +2 to pitch roll this at-bat |
| Home Field | Utility | Home team +1 pitch roll for one inning |
| Error | Offense | Defense fielding check or runner advances |
| Defensive Gem | Defense | Convert one hit result to out |
| Walk-Off | Utility | Bonus effect on game-ending hit |
| Extra Innings | Utility | Tie game triggers extra innings clause |
| Sacrifice Fly | Offense | Runner on 3rd scores on next FB out |

---

## Audio

### Library: Howler.js

Sound sprite architecture — single `sounds.mp3` with all effects, loaded once on app init.

### Files

- `src/audio/soundEngine.ts` — Howler wrapper, respects settings store sound toggle (when off, all calls are no-ops)
- `src/audio/sounds.ts` — Sprite map definitions (name → start/end timestamps)

### Hook

`useSound()` — returns play functions. Components call `playSound('batCrack')`, engine handles the rest.

### Sound Effects

| Sound | Trigger |
|---|---|
| Dice roll | Dice spinning |
| Dice land | Dice settles on result |
| Bat crack | Hit results (1B, 2B, 3B, HR) |
| Crowd cheer | HR, game win |
| Crowd groan | Strikeout, DP |
| Umpire "strike" | SO result |
| Glove pop | GB, FB outs |
| Pack rip | Opening a pack |
| Card flip | Pack card reveal |
| Foil sparkle | Foil card revealed |
| UI click | Menu navigation |
| Walk-up jingle | New batter steps up |

### Implementation Timing

- `soundEngine.ts` and `useSound()` hook built in Phase 4 so all components can call it from day one
- Actual sound assets sourced and compiled into sprite during Phase 12 (polish)
- Until then, `useSound()` calls are silent no-ops

---

## Franchise Mode — Full Spec

### Starting a Franchise

Three entry paths:

**Path A — Pick a Team:** Choose any of 30 MLB teams. Each comes with a preset roster of 20 cards (9 position players + 3 bench + 5 SP + 3 RP) built from current MLB season stats.

**Path B — Pack Draft (MTG-style):** Open 10 booster packs (8 cards each = 80 cards). Cards reveal with animation and rarity flash. Draft your active roster from the pool — 5 SP, 3 RP, 9 position players + bench. Undrafted cards become your bench/trade pool. After user drafts, CPU teams are auto-assembled from their real MLB rosters.

**Path C — Team Builder:** Build a custom roster (5000 pt budget), enter franchise with that squad.

### Season Structure

Choose at franchise creation: 10 / 30 / 50 games.

- Schedule randomly assigns opponents with roughly equal home/away (not all 29 teams will be faced in shorter seasons)
- CPU vs CPU games simulate headlessly via `simulation.ts` (same engine, no animation)
- All CPU game results available as full box scores — click any completed game in Schedule view
- User plays their own games from the Schedule screen

### 30-Team League

All 30 teams use real MLB rosters from the most recent full season, converted to Showdown cards. Organized into 6 divisions matching real MLB structure:

- AL East, AL Central, AL West
- NL East, NL Central, NL West
- 5 teams per division

CPU simulations use the real engine — upsets happen, star players matter, standings reflect card quality.

### Roster Management (Between Games)

**Roster Size: 20 per team**

| Slot | Count |
|---|---|
| SP | 5 (4 active rotation + 1 bench) |
| RP | 3 (2 active bullpen + 1 bench) |
| Position players (starting) | 9 (C, 1B, 2B, 3B, SS, LF, CF, RF, DH) |
| Bench position players | 3 |

**Pitcher Rotation:**
- Set your starter before each game from Franchise Hub
- Hard rule: no SP can start consecutive games (always enforced)
- SP who pitched yesterday shown with "Needs Rest" badge, greyed out in picker
- RP available every game unless injured

**Lineup Changes:**
- Set batting order before each game
- Swap any position player in/out from bench
- Bench depth varies by start mode (Pack Draft produces the most depth)

**Trades:**
- Mid-season window opens after 40% of games played
- Offer bench/rotation players to any CPU team in exchange for one of theirs
- CPU accepts/rejects based on point-value comparison + slight randomness
- Max 3 trades per season

**Injuries and Rest (Optional — toggle in Settings):**
- Pitchers: small injury chance weighted by IP overuse
- Position players: small chance after 3 consecutive games played
- Injured players miss 1–3 games, shown with injury icon
- Rest mechanic: fatigued players get -1 effective OB or Control until rested one game

### Aging and Retirement (Optional — toggle in Settings)

- Each player has `seasonsRemaining` set at franchise creation (range: 2–8 seasons, weighted by era)
- Decrements by 1 at end of each season
- At 0: player retires — shown in end-of-season "Retirement Announcements" screen
- CPU teams auto-fill from a replacement pool
- User can sign 1 free agent from a 3-option pool when a key player retires

### Season Simulation Flow

```
Franchise Start (pick mode)
    ↓
Set Lineup + Rotation
    ↓
Schedule View → Play your game OR Advance Day (simulates all CPU games that day)
    ↓
Game Screen (your game) OR Box Score popup (CPU games)
    ↓
Result → updated standings + stat leaders in Franchise Hub
    ↓
Repeat until all regular season games complete
    ↓
Season Awards Screen (MVP, Cy Young, Batting Title, HR Leader, SB Leader)
    ↓
Playoff Bracket unlocks (6 division winners + 2 wild cards, seeded 1–8)
    ↓
Play through bracket (best-of-5 each round, 3 rounds total)
    ↓
World Series → gold borders, confetti on win
    ↓
Championship Screen → trophy added to Awards Cabinet
    ↓
New Season? → aging/retirement resolves → free agent signings → new schedule
```

### Playoff Seeding

- 6 division winners auto-qualify, seeded 1–6 by record
- 2 wild card spots: best remaining records regardless of division
- Wild cards seeded 7–8
- Matchups: 1v8, 2v7, 3v6, 4v5

### Season Awards

Tracked live, displayed at season end:

| Award | Criteria |
|---|---|
| MVP | Highest weighted OBP + HR + SB score |
| Cy Young | Best SO rate + lowest HR allowed rate |
| Batting Title | Highest OBP (minimum PA threshold) |
| Home Run Leader | Most HR in season |
| Stolen Base Leader | Most successful SBs |
| World Series Ring | Franchise champion — stored permanently in Awards Cabinet |

All-Franchise Team accumulates over multiple seasons (best player per position by career stats within a franchise save).

### Stat Tracking

**Batters:** PA, AB, H, 1B, 2B, 3B, HR, BB, SO, RBI, R, SB, OBP, SLG, OPS
**Pitchers:** G, GS, IP, H, BB, SO, HR allowed, W, L, ERA equivalent, WHIP equivalent

Seasonal stats reset each season for leaderboards. Career totals persist for the life of the franchise save.

---

## CPU Difficulty

Three tiers for Solo vs CPU mode:

| Difficulty | Strategy Cards | Stealing | Pitching Management |
|---|---|---|---|
| **Easy** | Plays cards randomly | Never steals | Leaves pitcher in regardless of fatigue |
| **Medium** | Plays cards sensibly (situational) | Steals with Speed A runners | Pulls pitcher when fatigued (IP exceeded) |
| **Hard** | Optimal timing — saves cards for high-leverage moments | Steals at best moments (scoring position, close games) | Aggressive pitching changes, matchup-aware |

---

## Data Model

### Player Card Schema

```typescript
interface PlayerCard {
  id: string
  name: string
  year: number
  team: string
  teamColor: string
  position: 'SP' | 'RP' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH'
  throws: 'R' | 'L'
  bats: 'R' | 'L' | 'S'
  points: number
  rarity: 'common' | 'uncommon' | 'rare' | 'foil'
  seasonsRemaining?: number       // franchise aging
  headshotUrl: string             // MLB headshot image path
  mlbPlayerId: number             // MLB Stats API player ID

  // Pitchers only
  control?: number                // 0–6
  ip?: number
  pitcherChart?: OutcomeChart

  // Batters only
  onBase?: number                 // 7–16
  speed?: 'A' | 'B' | 'C'
  fielding?: number               // 1–5
  arm?: number                    // 1–5
  batterChart?: OutcomeChart
}

type OutcomeChart = Record<number, AtBatResult>  // keys 1–20

type AtBatResult =
  | 'SO' | 'GB' | 'FB' | 'DP'
  | 'BB' | '1B' | '2B' | '3B' | 'HR'
```

### Franchise State Schema

```typescript
interface FranchiseState {
  id: string
  name: string
  startMode: 'preset' | 'packDraft' | 'teamBuilder'
  currentSeason: number
  seasonLength: 10 | 30 | 50
  userTeam: Team
  allTeams: Team[]
  schedule: ScheduledGame[]
  standings: StandingsRow[]
  seasonStats: Record<string, PlayerSeasonStats>
  careerStats: Record<string, PlayerCareerStats>
  awards: AwardRecord[]
  playoffBracket?: PlayoffBracket
  settings: FranchiseSettings
  history: SeasonHistoryRecord[]
}

interface FranchiseSettings {
  injuries: boolean
  aging: boolean
  tradeDeadline: boolean
}
```

---

## Card Data Source

All card stats are generated from the **most recent full MLB season** (including playoffs) using a Python build script that pulls from the free MLB Stats API. See `ROSTER_AND_STATS.md` for the complete data pipeline, stat-to-card conversion formulas, rarity system, and headshot sourcing.

---

## Folder Structure

```
mlb-showdown/
├── scripts/
│   └── generate-cards.py          # Data pipeline: MLB API → card data
├── src/
│   ├── audio/
│   │   ├── soundEngine.ts         # Howler.js wrapper
│   │   └── sounds.ts              # Sprite map definitions
│   ├── components/
│   │   ├── Card/
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── CardBack.tsx
│   │   │   ├── OutcomeChart.tsx
│   │   │   └── StrategyCard.tsx
│   │   ├── Dice/
│   │   │   ├── D20.tsx
│   │   │   └── DiceRoller.tsx
│   │   ├── Diamond/
│   │   │   ├── BaseballDiamond.tsx
│   │   │   └── RunnerToken.tsx
│   │   ├── Scoreboard/
│   │   │   ├── Scoreboard.tsx
│   │   │   └── ScorebarMobile.tsx
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── AtBatPanel.tsx
│   │   │   ├── StrategyHand.tsx
│   │   │   └── GameLog.tsx
│   │   ├── Franchise/
│   │   │   ├── ScheduleView.tsx
│   │   │   ├── StandingsTable.tsx
│   │   │   ├── RosterManager.tsx
│   │   │   ├── StatLeaders.tsx
│   │   │   ├── PlayoffBracket.tsx
│   │   │   ├── AwardsCabinet.tsx
│   │   │   ├── TradePanel.tsx
│   │   │   └── FranchiseHistory.tsx
│   │   ├── PackDraft/
│   │   │   ├── PackOpener.tsx
│   │   │   ├── PackReveal.tsx
│   │   │   └── DraftBoard.tsx
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Badge.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── TeamBuilderScreen.tsx
│   │   ├── QuickPlaySelectScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   ├── FranchiseHubScreen.tsx
│   │   ├── PlayoffBracketScreen.tsx
│   │   ├── PackDraftScreen.tsx
│   │   ├── SeasonAwardsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── game/
│   │   ├── engine.ts
│   │   ├── dice.ts
│   │   ├── baserunning.ts
│   │   ├── fatigue.ts
│   │   ├── strategy.ts
│   │   ├── cpu.ts
│   │   ├── simulation.ts
│   │   ├── stateMachine.ts
│   │   └── franchiseEngine.ts
│   ├── data/
│   │   ├── cards/
│   │   │   ├── teams/              # Generated: one file per MLB team
│   │   │   ├── allCards.ts         # Generated: master card index
│   │   │   └── strategyCards.ts
│   │   ├── teams.ts                # 30 team metadata (colors, divisions, logos)
│   │   └── presetTeams.ts          # 4 Quick Play preset teams
│   ├── store/
│   │   ├── gameStore.ts
│   │   ├── franchiseStore.ts
│   │   ├── teamStore.ts
│   │   ├── screenStore.ts          # Navigation state
│   │   └── persistMiddleware.ts
│   ├── hooks/
│   │   ├── useGame.ts
│   │   ├── useFranchise.ts
│   │   ├── useDice.ts
│   │   ├── useSound.ts
│   │   └── useLocalStorage.ts
│   ├── styles/
│   │   ├── index.css
│   │   ├── card.css
│   │   └── dice.css
│   └── utils/
│       ├── chartLookup.ts
│       ├── pointsCalc.ts
│       ├── cardGenerator.ts
│       ├── statsCalc.ts
│       └── scheduleGenerator.ts
├── public/
│   ├── fonts/
│   ├── images/
│   │   └── players/                # Generated: MLB headshots
│   └── sounds/
│       └── sounds.mp3              # Sound sprite (Phase 12)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Build Phases

### Phase 0 — Data Pipeline
- `scripts/generate-cards.py` — pull current MLB rosters + stats from MLB Stats API
- Convert real stats to Showdown card attributes (see `ROSTER_AND_STATS.md`)
- Generate outcome charts (1–20) for all ~600 players
- Download headshot images
- Output TypeScript card data files to `src/data/cards/`
- **Deliverable**: All 30 teams × 20 cards as static TypeScript data, ready for import

### Phase 1 — Game Engine Core (pure logic, no UI)
- `dice.ts` — d20 roll, seedable for replay
- `engine.ts` — pitch resolution, advantage, chart lookup, result application
- `baserunning.ts` — all advancement rules for every result type
- `stateMachine.ts` — phases, out counting, inning transitions, extra innings (standard, no ghost runner)
- `fatigue.ts` — IP tracking, pitch roll penalty
- Console-verify a full 9-inning game before any UI

### Phase 2 — Card Component
- `PlayerCard.tsx` — faithful card face: name, position, stats, outcome chart grid, team color border, headshot photo
- Pitcher layout vs batter layout as separate branches
- `OutcomeChart.tsx` — 1–20 grid, highlights active roll
- Card flip animation (CSS 3D transform)
- Foil shimmer on rare cards (CSS gradient animation)
- Scales cleanly 320px to 1440px

### Phase 3 — Dice Component
- CSS 3D icosahedron using clip-path + transform
- Roll animation: spin + wobble + settle (~1.2s)
- Face displays result number on settle
- Mobile tap + desktop click
- Animation speed respects Settings toggle

### Phase 4 — Game Board + Core Loop
- `GameBoard.tsx` layout
- `AtBatPanel.tsx` — matchup display, advantage indicator, result banner
- `BaseballDiamond.tsx` — SVG field, animated runner tokens
- `Scoreboard.tsx` + `ScorebarMobile.tsx`
- `GameLog.tsx` — scrollable play-by-play
- `soundEngine.ts` + `useSound()` hook (silent no-ops until Phase 12 assets)
- `screenStore.ts` — Zustand navigation state
- Zustand store wired to all components
- Full 9-inning game playable end-to-end

### Phase 5 — Strategy Cards
- `StrategyCard.tsx` — red/blue/white card design
- `StrategyHand.tsx` — fan layout, tap-to-select + confirm
- All 20 strategy card handlers in `strategy.ts`
- Card draw: start with 3, draw 1 per half-inning, max hand size 5
- Discard pile + deck counter

### Phase 6 — All Game Modes
- Quick Play team select + 4 preset rosters
- Hot Seat: "Pass Device" screen hides strategy hand between half-innings
- CPU logic in `cpu.ts`: strategy card decisions, pitcher management
- CPU difficulty: Easy / Medium / Hard (see CPU Difficulty section)
- `simulation.ts`: headless full-game simulation for CPU vs CPU

### Phase 7 — Team Builder + Custom Cards
- Card browser, drag-to-roster, budget tracker
- Save/load up to 5 custom rosters
- Custom card generator with full stat assignment
- `cardGenerator.ts` validates and adds to collection

### Phase 8 — Franchise Foundation
- `franchiseStore.ts` with localStorage persistence
- `franchiseEngine.ts`: schedule generation, standings, CPU game simulation
- `FranchiseHubScreen.tsx`: all seven sections wired up
- `scheduleGenerator.ts`: random opponent assignment for 10/30/50 game seasons (not all teams faced in shorter seasons)
- All 30 team rosters from generated card data
- Advance Day functionality

### Phase 9 — Franchise Roster Management
- Pitcher rotation picker with rest-status enforcement
- Lineup order setter
- Trade panel: mid-season window, CPU accept/reject
- Injury system (optional toggle)
- Aging/retirement at season end (optional toggle)
- Free agent signing pool (retirement replacement)

### Phase 10 — Pack Draft Mode
- `PackDraftScreen.tsx`
- `PackOpener.tsx` — 10 packs x 8 cards, sequential open
- `PackReveal.tsx` — fan-out animation, rarity flash per card
- `DraftBoard.tsx` — 80-card pool, draft to roster slots
- Pack rarity distribution per pack: 4 common, 2 uncommon, 1 rare, 1 rare-or-foil
- CPU teams auto-assembled from their real rosters after user drafts

### Phase 11 — Season Awards + Playoffs
- `SeasonAwardsScreen.tsx` — trophy ceremony, one award at a time
- Award formulas in `statsCalc.ts`
- `PlayoffBracketScreen.tsx` — 8-team visual bracket with division-based seeding
- 6 division winners (seeded 1–6) + 2 wild cards (seeded 7–8)
- Best-of-5 series tracking per matchup
- World Series: gold borders, confetti on win
- Trophy persisted in Awards Cabinet

### Phase 12 — Polish + Responsive QA
- Source and compile sound effects into `sounds.mp3` sprite
- Wire all `useSound()` calls to real audio
- Responsive QA: iPhone SE (320px), iPhone 14 (390px), iPad (768px), 1280px, 1440px
- Performance: lazy-load screens, memoize card renders, 60fps dice on mobile
- Accessibility: keyboard nav, ARIA labels
- Settings: all toggles functional
- Reset with confirmation modal
- localStorage stress test (large multi-season franchise save)

---

## Classic Preset Card Set

### Quick Play Preset Teams (4)
- **Murderers Row** — Power-heavy slugger lineup, HR-dominant charts
- **Ace Factory** — Elite pitching rotation, pitching-dominant
- **Speed Demons** — High-OB + A-speed runners, stolen base heavy
- **Classic 2000** — Balanced team, mix of power and contact

These 4 teams are hand-curated subsets from the generated card pool, selected for distinct play styles.

### Future Classic Expansions
The data pipeline (`scripts/generate-cards.py`) supports any historical season. Planned:
- **2000 Classics** — Original Showdown era (Bonds, Pedro, Jeter, Griffey)
- **2010s Stars** — Trout, Kershaw, Altuve, Betts
- **All-Time Legends** — Ruth, Aaron, Mays, Clemente (manual data or Baseball Reference)

---

## Responsive Layout Strategy

| Breakpoint | Layout |
|---|---|
| Below 640px (mobile) | Cards stacked vertically, large dice tap target, scorebar as bottom strip, strategy hand scrolls horizontally |
| 640px to 1024px (tablet) | Cards side by side, diamond below, strategy hand scrolls |
| 1024px and above (desktop) | Three-column game board, pitcher left / diamond center / batter right |

---

## Definition of Done — v1 Shippable

- Full 9-inning game playable in all four modes (Quick Play, Hot Seat, CPU, Franchise)
- All 20 strategy cards implemented and functional
- 600+ player cards generated from current MLB season with real stats and headshots
- 4 Quick Play preset teams
- Franchise: 30 teams, 10/30/50 game seasons, division-based 8-team playoff bracket (best-of-5)
- Pack Draft: 10-pack opening with reveal animation, 80-card draft to roster
- All three franchise start modes working
- Season awards ceremony + career stat tracking across seasons
- Pitcher rest enforcement, lineup management, mid-season trades
- Injuries and aging optionally toggleable
- CPU difficulty: Easy / Medium / Hard
- 3D animated d20 dice roll at 60fps on mobile
- Baseball diamond SVG with animated runner tokens
- Classic inning-by-inning scoreboard + mobile score strip
- Sound effects for all major game events
- Responsive: iPhone SE through 1440p desktop, no jank
- All game state and franchise saves persist to localStorage, resume on reload
- Settings panel: animation speed, sound, injury toggle, aging toggle, reset data
