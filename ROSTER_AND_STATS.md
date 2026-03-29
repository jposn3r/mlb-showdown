# Roster & Stats Pipeline

How we get real MLB data and convert it into Showdown cards for all 30 teams.

---

## Phase 1: Pull Raw Data

### Data Source: MLB Stats API (free, no key required)

**Base URLs:**
- Modern API: `https://statsapi.mlb.com/api/v1/`
- Legacy API: `http://lookup-service-prod.mlb.com/json/named.[endpoint].bam`

### Step 1A: Get All 30 Team IDs

```
GET https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2025
```

Returns all 30 MLB teams with `team.id` values we need for roster lookups.

### Step 1B: Pull 40-Man Rosters

```
GET https://statsapi.mlb.com/api/v1/teams/{teamId}/roster?rosterType=40Man&season=2025
```

For each of the 30 teams. Returns player IDs, names, positions, jersey numbers.

### Step 1C: Pull Player Stats

For each player on each roster:

```
GET https://statsapi.mlb.com/api/v1/people/{playerId}/stats?stats=season&season=2025&group=hitting
GET https://statsapi.mlb.com/api/v1/people/{playerId}/stats?stats=season&season=2025&group=pitching
```

**Batting stats we need:** G, PA, AB, H, 2B, 3B, HR, BB, SO, SB, CS, AVG, OBP, SLG, OPS
**Pitching stats we need:** G, GS, IP, H, BB, SO, HR, ERA, WHIP, W, L, SV

### Step 1D: Pull Player Bio/Details

```
GET https://statsapi.mlb.com/api/v1/people/{playerId}
```

Gives us: full name, position, bats (R/L/S), throws (R/L), height, weight, age, debut year.

### Step 1E: Player Headshot Photos

URL pattern (no API call needed — just construct the URL from the player ID):

```
https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/{playerId}/headshot/67/current
```

- `w_213` can be changed to any width (e.g., `w_426` for 2x)
- Falls back to a generic silhouette if no photo exists
- These are official MLB headshots, updated each season

### Step 1F: Team Logos

```
https://www.mlbstatic.com/team-logos/{teamId}.svg
```

---

## Phase 2: Convert Stats to Showdown Card Attributes

### Batters

| Card Attribute | Derived From | Formula |
|---|---|---|
| **onBase** (7–16) | OBP | `round(7 + (OBP - .250) / (.200) * 9)` clamped to 7–16. League-average OBP (~.310) → 10. Elite (.400+) → 14–16. |
| **speed** (A/B/C) | SB + CS + sprint speed | A: 25+ SB/season or top-15% sprint speed. B: 10–24 SB. C: below 10 SB. |
| **points** | Composite value | Weighted formula: `(onBase * 40) + (speedBonus) + (HR_rate * 200) + (fielding * 10)`. See point tiers below. |
| **fielding** (1–5) | Defensive metrics (DRS/OAA if available, else position default) | 5 = elite, 3 = average, 1 = liability. Default by position if no data. |
| **arm** (1–5) | Position + assists | Mainly for OF/C. 5 = elite arm, 3 = average. |

### Pitchers

| Card Attribute | Derived From | Formula |
|---|---|---|
| **control** (0–6) | BB/9, WHIP | `round(6 - (BB9 - 1.5) / (3.5) * 6)` clamped 0–6. Low walk rate → high control. |
| **ip** (innings effective) | IP/GS for SP, typical relief outing for RP | SP: `round(IP / GS)` clamped 4–9. RP: 1–2 based on usage. |
| **points** | Composite value | Weighted: `(control * 50) + (SO_rate * 100) + (ip * 20) - (HR_rate * 150)`. |

### Outcome Charts (1–20)

This is the heart of the card. Each number 1–20 maps to an at-bat result.

**Batter chart generation** (used when batter has advantage):

| Stat Input | Chart Slots | Logic |
|---|---|---|
| SO rate (SO/PA) | SO slots | `round(SO/PA * 20)` slots assigned to SO (e.g., 25% K rate → 5 slots) |
| BB rate (BB/PA) | BB slots | `round(BB/PA * 20)` slots |
| HR rate (HR/AB) | HR slots | `round(HR/AB * 20)`, min 1 for power hitters |
| 3B rate | 3B slots | Usually 0–1 slot |
| 2B rate | 2B slots | `round(2B/AB * 20)` |
| 1B (remainder of hits) | 1B slots | Remaining hit slots after HR/3B/2B |
| GB tendency | GB slots | Fill remaining with GB/FB based on GB% |
| FB tendency | FB slots | Remaining slots |

Chart slots are ordered worst-to-best: SO and DP occupy the low numbers (1–X), outs (GB/FB) in the middle, walks and singles in the upper-middle, and extra-base hits at the top (17–20). This means high rolls are good for batters.

**Pitcher chart generation** (used when pitcher has advantage):

Pitchers' charts are weighted toward outs. Same logic but:
- More SO/GB/FB slots (pitchers get batters out most of the time)
- Fewer hit slots
- Elite pitchers: 12+ out slots on their chart
- Bad pitchers: only 8–9 out slots, more hits given up

**Validation:** Every chart must have exactly 20 slots summing to a valid distribution. No chart should have 0 outs or 0 ways to reach base.

### Double Play Slots

- DP appears on pitcher charts only (replaces 1–2 GB slots for ground-ball pitchers)
- Max 2 DP slots per chart
- Only triggers with runner on 1st (otherwise treated as GB)

---

## Phase 3: Rarity System

### How the Original Game Did It

The 2000 MLB Showdown set had:
- **400 base player cards** (standard printing)
- **~60 foil cards** (short-printed, 1:27 pack pull rate) — the best players got foil versions with premium art treatment
- **1st Edition vs Unlimited** print runs

There was no common/uncommon/rare tier on the cards themselves — just base vs foil.

### Our Rarity System

We'll expand slightly for gameplay variety in pack drafting, while keeping it simple:

| Rarity | Description | % of Card Pool | Point Range | Visual Treatment |
|---|---|---|---|---|
| **Common** | Role players, bench bats, back-end rotation | 45% | 80–199 pts | Standard card, no effects |
| **Uncommon** | Solid starters, reliable arms | 30% | 200–349 pts | Subtle silver name text |
| **Rare** | All-Stars, ace pitchers | 18% | 350–499 pts | Gold name text + border shimmer |
| **Foil** | MVP candidates, Cy Young contenders | 7% | 500–700 pts | Holographic foil overlay + animated shimmer |

### Rarity Assignment Logic

Rarity is determined by the player's **point value**, which is derived from their real stats:

1. Calculate points from the stat conversion formulas above
2. Assign rarity tier based on point range
3. The top ~2 players per team should land in Foil tier
4. Every team should have at least 3 Rare, 5 Uncommon, and the rest Common

### Point Budget Reference

- Team roster cap: **5,000 points** across 20 players
- Average card: ~250 points
- A team stacked with all-foils would bust the cap — forces real team-building decisions

---

## Phase 4: Roster Construction

### Per Team: 20 Cards

| Slot | Count | Notes |
|---|---|---|
| SP | 5 | 4 active rotation + 1 bench/spot starter |
| RP | 3 | 2 active bullpen + 1 bench reliever |
| C | 1–2 | Starting catcher + backup if available |
| 1B | 1 | |
| 2B | 1 | |
| 3B | 1 | |
| SS | 1 | |
| LF | 1 | |
| CF | 1 | |
| RF | 1 | |
| DH | 0–1 | AL teams, or power bat without a position |
| Bench position players | 2–3 | Utility/backup fielders |

### Player Selection per Team

From each team's 40-man roster, select the top 20 by:

1. **Starters:** Best player at each position by points/WAR
2. **Rotation:** Top 5 SP by ERA/IP
3. **Bullpen:** Top 2–3 RP by ERA/SV/holds
4. **Bench:** Next-best position players by points

Players with insufficient MLB stats (< 50 PA or < 20 IP) get minimum-tier cards or are skipped in favor of players with real data.

---

## Phase 5: Pack Draft Card Pool

### How Packs Work in Franchise Mode

User opens 10 packs × 8 cards = 80 cards, then drafts a 20-player roster.

### Pack Contents (per pack of 8)

| Slot | Rarity | Count |
|---|---|---|
| 1–4 | Common | 4 |
| 5–6 | Uncommon | 2 |
| 7 | Rare | 1 |
| 8 | Rare or Foil (1 in 3 chance of Foil) | 1 |

Over 10 packs (80 cards), expected distribution:
- ~40 Common
- ~20 Uncommon
- ~14 Rare (after foil upgrades)
- ~6 Foil

### Draft Pool Construction

The 80-card pool is drawn from the **entire MLB card set** (600 cards across all 30 teams), not from a single team. This means:

- You might draft a pitcher from the Yankees and a batter from the Dodgers
- Your drafted team is a custom all-star squad
- Undrafted cards go to bench/trade pool
- Position balance is roughly enforced: pool always contains at least 8 SP, 4 RP, and 2+ players at each position

### CPU Team Assembly (Franchise)

After the user drafts, the remaining 29 CPU teams use their **actual MLB team rosters** (the pre-built 20-card rosters from Phase 4). The user's team is the only custom-drafted one.

---

## Phase 6: Player Photos & Card Art

### Headshots

Every card displays the player's official MLB headshot:

```
https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_426,q_auto:best/v1/people/{playerId}/headshot/67/current
```

- Fetched at 426px wide (2x for retina)
- Cached locally as static assets during the build step
- Generic silhouette fallback for missing photos

### Team Colors

Each card's border uses the team's primary + secondary colors. Sourced from a static lookup table of all 30 teams (hex values for primary, secondary, and accent colors).

### Card Face Layout

```
┌─────────────────────────┐
│ [Team Color Border]      │
│ ┌─────────────────────┐ │
│ │     HEADSHOT         │ │
│ │     PHOTO            │ │
│ ├─────────────────────┤ │
│ │ NAME          POS   │ │
│ │ Team • Year         │ │
│ ├─────────────────────┤ │
│ │ OB: 12   SPD: A     │ │  ← Batter
│ │ CTRL: 5  IP: 7      │ │  ← Pitcher (alternate)
│ ├─────────────────────┤ │
│ │ CHART (1-20 grid)   │ │
│ │ 1:SO  2:SO  3:GB .. │ │
│ │ ..  18:2B 19:HR 20:HR│ │
│ ├─────────────────────┤ │
│ │ PTS: 450  ★★★ Rare  │ │
│ └─────────────────────┘ │
│ [Foil shimmer overlay]   │
└─────────────────────────┘
```

---

## Phase 7: Build Script

### Implementation: `scripts/generate-cards.py`

Single Python script that runs as a one-time data pipeline:

```bash
pip install requests
python scripts/generate-cards.py --season 2025
```

**What it does:**

1. Fetch all 30 team rosters from MLB Stats API
2. Fetch batting + pitching stats for every player
3. Fetch player bio (bats/throws/position)
4. Convert stats → Showdown card attributes using formulas above
5. Generate outcome charts (1–20) for each player
6. Assign rarity based on point value
7. Download headshot images to `public/images/players/{playerId}.png`
8. Output card data as TypeScript:
   - `src/data/cards/teams/{teamName}.ts` — one file per team (20 cards each)
   - `src/data/cards/allCards.ts` — master index
   - `src/data/teams.ts` — team metadata (colors, logos, division)

**Output format per card:**

```typescript
{
  id: "player-545361",
  name: "Mike Trout",
  year: 2025,
  team: "LAA",
  teamColor: "#BA0021",
  position: "CF",
  throws: "R",
  bats: "R",
  points: 520,
  rarity: "foil",
  onBase: 14,
  speed: "B",
  fielding: 4,
  arm: 3,
  batterChart: {
    1: "SO", 2: "SO", 3: "SO", 4: "GB",
    5: "GB", 6: "FB", 7: "FB", 8: "BB",
    9: "BB", 10: "BB", 11: "1B", 12: "1B",
    13: "1B", 14: "1B", 15: "1B", 16: "2B",
    17: "2B", 18: "2B", 19: "HR", 20: "HR"
  },
  headshotUrl: "/images/players/545361.png",
  mlbPlayerId: 545361
}
```

---

## Phase 8: Future Classic Card Expansion

Once the pipeline works for current rosters, we can easily add historic seasons:

### Planned Expansions

| Set | Source | Cards |
|---|---|---|
| **2000 Classics** | 2000 season stats via same API (`season=2000`) | Original Showdown era — Bonds, Pedro, Jeter, Griffey |
| **2010s Stars** | 2015–2019 stats | Trout, Kershaw, Altuve, Betts |
| **All-Time Legends** | Career stats | Ruth, Aaron, Mays, Clemente (would need manual data or Baseball Reference) |

### How to Add a New Set

1. Run `python scripts/generate-cards.py --season 2000 --set classics-2000`
2. Script pulls that season's rosters + stats
3. Outputs to `src/data/cards/sets/classics-2000/`
4. Register the set in `src/data/cards/sets/index.ts`
5. Cards from all sets are available in pack drafts and team builder

### Historical Data Availability

The MLB Stats API has data going back to the 1800s for basic stats. For seasons before ~2015, advanced metrics (sprint speed, OAA) won't be available — the script falls back to traditional stats (SB for speed, position for fielding defaults).

---

## Licensing Notes

- MLB Stats API is free and public, no key needed
- Player headshots from `mlbstatic.com` are served publicly
- This is a fan project / personal use — not for commercial distribution
- Player names and likenesses are MLB/MLBPA property
- If this ever goes public, would need to anonymize or license
