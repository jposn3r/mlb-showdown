#!/usr/bin/env python3
"""
MLB Showdown Card Generator

Pulls real MLB player data from the free MLB Stats API and converts it
into Showdown card data (TypeScript files) for the game.

Usage:
    python scripts/generate-cards.py --season 2025
    python scripts/generate-cards.py --season 2024  # fallback if 2025 not available yet
"""

import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

API_BASE = "https://statsapi.mlb.com/api/v1"

# Real MLB divisions
DIVISIONS = {
    "AL East": [{"name": "New York Yankees", "abbr": "NYY", "id": 147, "colors": ["#003087", "#E4002C"]},
                {"name": "Boston Red Sox", "abbr": "BOS", "id": 111, "colors": ["#BD3039", "#0C2340"]},
                {"name": "Toronto Blue Jays", "abbr": "TOR", "id": 141, "colors": ["#134A8E", "#1D2D5C"]},
                {"name": "Baltimore Orioles", "abbr": "BAL", "id": 110, "colors": ["#DF4601", "#27251F"]},
                {"name": "Tampa Bay Rays", "abbr": "TB", "id": 139, "colors": ["#092C5C", "#8FBCE6"]}],
    "AL Central": [{"name": "Cleveland Guardians", "abbr": "CLE", "id": 114, "colors": ["#00385D", "#E50022"]},
                   {"name": "Minnesota Twins", "abbr": "MIN", "id": 142, "colors": ["#002B5C", "#D31145"]},
                   {"name": "Detroit Tigers", "abbr": "DET", "id": 116, "colors": ["#0C2340", "#FA4616"]},
                   {"name": "Chicago White Sox", "abbr": "CWS", "id": 145, "colors": ["#27251F", "#C4CED4"]},
                   {"name": "Kansas City Royals", "abbr": "KC", "id": 118, "colors": ["#004687", "#BD9B60"]}],
    "AL West": [{"name": "Houston Astros", "abbr": "HOU", "id": 117, "colors": ["#002D62", "#EB6E1F"]},
                {"name": "Seattle Mariners", "abbr": "SEA", "id": 136, "colors": ["#0C2C56", "#005C5C"]},
                {"name": "Texas Rangers", "abbr": "TEX", "id": 140, "colors": ["#003278", "#C0111F"]},
                {"name": "Los Angeles Angels", "abbr": "LAA", "id": 108, "colors": ["#BA0021", "#003263"]},
                {"name": "Oakland Athletics", "abbr": "OAK", "id": 133, "colors": ["#003831", "#EFB21E"]}],
    "NL East": [{"name": "Atlanta Braves", "abbr": "ATL", "id": 144, "colors": ["#CE1141", "#13274F"]},
                {"name": "Philadelphia Phillies", "abbr": "PHI", "id": 143, "colors": ["#E81828", "#002D72"]},
                {"name": "New York Mets", "abbr": "NYM", "id": 121, "colors": ["#002D72", "#FF5910"]},
                {"name": "Miami Marlins", "abbr": "MIA", "id": 146, "colors": ["#00A3E0", "#EF3340"]},
                {"name": "Washington Nationals", "abbr": "WSH", "id": 120, "colors": ["#AB0003", "#14225A"]}],
    "NL Central": [{"name": "Milwaukee Brewers", "abbr": "MIL", "id": 158, "colors": ["#FFC52F", "#12284B"]},
                   {"name": "Chicago Cubs", "abbr": "CHC", "id": 112, "colors": ["#0E3386", "#CC3433"]},
                   {"name": "St. Louis Cardinals", "abbr": "STL", "id": 138, "colors": ["#C41E3A", "#0C2340"]},
                   {"name": "Pittsburgh Pirates", "abbr": "PIT", "id": 134, "colors": ["#27251F", "#FDB827"]},
                   {"name": "Cincinnati Reds", "abbr": "CIN", "id": 113, "colors": ["#C6011F", "#000000"]}],
    "NL West": [{"name": "Los Angeles Dodgers", "abbr": "LAD", "id": 119, "colors": ["#005A9C", "#EF3E42"]},
                {"name": "San Diego Padres", "abbr": "SD", "id": 135, "colors": ["#2F241D", "#FFC425"]},
                {"name": "Arizona Diamondbacks", "abbr": "ARI", "id": 109, "colors": ["#A71930", "#E3D4AD"]},
                {"name": "San Francisco Giants", "abbr": "SF", "id": 137, "colors": ["#FD5A1E", "#27251F"]},
                {"name": "Colorado Rockies", "abbr": "COL", "id": 115, "colors": ["#333366", "#C4CED4"]}],
}

# Position mapping from MLB API codes
POSITION_MAP = {
    "P": "SP", "SP": "SP", "RP": "RP", "CP": "RP", "CL": "RP",
    "C": "C", "1B": "1B", "2B": "2B", "3B": "3B", "SS": "SS",
    "LF": "LF", "CF": "CF", "RF": "RF", "OF": "CF", "DH": "DH",
    "IF": "SS", "UT": "DH",
}


def api_get(endpoint, retries=3):
    """Fetch JSON from MLB Stats API with retries."""
    url = f"{API_BASE}{endpoint}"
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": "MLBShowdownCardGen/1.0"})
            with urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except (HTTPError, URLError, TimeoutError) as e:
            if attempt < retries - 1:
                time.sleep(1)
                continue
            print(f"  WARNING: Failed to fetch {url}: {e}")
            return None


def get_roster(team_id, season):
    """Get 40-man roster for a team."""
    data = api_get(f"/teams/{team_id}/roster?rosterType=40Man&season={season}")
    if not data or "roster" not in data:
        # Try active roster as fallback
        data = api_get(f"/teams/{team_id}/roster?rosterType=active&season={season}")
    if not data or "roster" not in data:
        return []
    return data["roster"]


def get_player_info(player_id):
    """Get player bio details."""
    data = api_get(f"/people/{player_id}")
    if not data or "people" not in data or len(data["people"]) == 0:
        return None
    return data["people"][0]


def get_player_stats(player_id, group, season):
    """Get season stats for a player."""
    data = api_get(f"/people/{player_id}/stats?stats=season&season={season}&group={group}")
    if not data or "stats" not in data:
        return None
    for stat_group in data["stats"]:
        if stat_group.get("splits"):
            for split in stat_group["splits"]:
                if split.get("season") == str(season):
                    return split.get("stat", {})
    return None


def clamp(val, lo, hi):
    return max(lo, min(hi, val))


def calc_onbase(obp):
    """Convert real OBP to Showdown onBase (7-16)."""
    # .250 OBP -> 7, .400+ OBP -> 14-16
    return clamp(round(7 + (obp - 0.250) / 0.020), 7, 16)


def calc_control(bb9, whip):
    """Convert BB/9 and WHIP to Showdown control (0-6)."""
    # Low BB/9 = high control
    # BB/9 of 1.5 -> 6, BB/9 of 5.0 -> 0
    control_from_bb = 6 - (bb9 - 1.5) / 3.5 * 6
    # Also factor in WHIP slightly
    whip_bonus = (1.3 - whip) * 1.5 if whip < 1.3 else 0
    return clamp(round(control_from_bb + whip_bonus), 0, 6)


def calc_speed(sb, cs, games):
    """Convert SB stats to speed rating."""
    if games == 0:
        return "C"
    sb_rate = sb / max(games, 1) * 162  # normalize to full season
    if sb_rate >= 25 or sb >= 20:
        return "A"
    elif sb_rate >= 10 or sb >= 8:
        return "B"
    return "C"


def calc_ip_rating(ip, gs):
    """Convert real IP/GS to Showdown IP rating."""
    if gs == 0:
        # Reliever
        return clamp(round(ip / max(1, 30) * 2), 1, 2)
    avg_ip = ip / max(gs, 1)
    return clamp(round(avg_ip), 4, 9)


def calc_fielding(position):
    """Default fielding by position (simplified without advanced metrics)."""
    defaults = {
        "C": 3, "1B": 2, "2B": 3, "3B": 3, "SS": 3,
        "LF": 2, "CF": 3, "RF": 3, "DH": 1,
        "SP": 2, "RP": 2,
    }
    return defaults.get(position, 2)


def calc_arm(position):
    """Default arm by position."""
    defaults = {
        "C": 4, "1B": 2, "2B": 2, "3B": 3, "SS": 3,
        "LF": 2, "CF": 3, "RF": 4, "DH": 1,
        "SP": 2, "RP": 2,
    }
    return defaults.get(position, 2)


def generate_batter_chart(stats):
    """Generate a 1-20 outcome chart for a batter based on their stats."""
    pa = stats.get("plateAppearances", 0) or 1
    ab = stats.get("atBats", 0) or 1

    so = stats.get("strikeOuts", 0)
    bb = stats.get("baseOnBalls", 0)
    hr = stats.get("homeRuns", 0)
    triples = stats.get("triples", 0)
    doubles = stats.get("doubles", 0)
    hits = stats.get("hits", 0)
    singles = hits - hr - triples - doubles

    # Calculate slot counts (out of 20)
    so_slots = clamp(round(so / pa * 20), 1, 8)
    bb_slots = clamp(round(bb / pa * 20), 1, 5)
    hr_slots = clamp(round(hr / ab * 20), 0, 4)
    triple_slots = clamp(round(triples / ab * 20), 0, 1)
    double_slots = clamp(round(doubles / ab * 20), 0, 4)
    single_slots = clamp(round(singles / ab * 20), 1, 6)

    # Ensure at least 1 HR slot for power hitters (20+ HR pace)
    if hr >= 15 and hr_slots == 0:
        hr_slots = 1

    # Fill slots - hits and walks first, then adjust outs to fill 20
    hit_walk_slots = so_slots + bb_slots + hr_slots + triple_slots + double_slots + single_slots

    # Remaining slots are GB/FB outs
    remaining = 20 - hit_walk_slots
    if remaining < 0:
        # Too many slots, reduce singles first, then doubles
        over = -remaining
        reduce_single = min(over, single_slots - 1)
        single_slots -= reduce_single
        over -= reduce_single
        if over > 0:
            reduce_double = min(over, double_slots)
            double_slots -= reduce_double
            over -= reduce_double
        if over > 0:
            reduce_bb = min(over, bb_slots - 1)
            bb_slots -= reduce_bb
            over -= reduce_bb
        if over > 0:
            reduce_so = min(over, so_slots - 1)
            so_slots -= reduce_so
            over -= reduce_so
        remaining = 0

    gb_slots = remaining // 2 + remaining % 2  # slightly more GB than FB
    fb_slots = remaining - gb_slots

    # No DP on charts — DP is auto-triggered when GB with runner on 1st and <2 outs

    # Build chart: worst to best (low rolls = bad for batter)
    chart = {}
    slot = 1
    for result, count in [
        ("SO", so_slots), ("GB", gb_slots), ("FB", fb_slots),
        ("BB", bb_slots), ("1B", single_slots), ("2B", double_slots),
        ("3B", triple_slots), ("HR", hr_slots)
    ]:
        for _ in range(count):
            if slot <= 20:
                chart[slot] = result
                slot += 1

    # Fill any remaining slots (shouldn't happen but safety)
    while slot <= 20:
        chart[slot] = "1B"
        slot += 1

    return chart


def generate_pitcher_chart(stats):
    """Generate a 1-20 outcome chart for a pitcher (opponent's chart when pitcher has advantage)."""
    # Pitcher charts are out-heavy
    ip = stats.get("inningsPitched", "0")
    if isinstance(ip, str):
        ip = float(ip) if ip else 0

    bf = stats.get("battersFaced", 0) or 1  # batters faced
    so = stats.get("strikeOuts", 0)
    bb = stats.get("baseOnBalls", 0)
    hr = stats.get("homeRuns", 0)
    hits = stats.get("hits", 0)
    doubles = stats.get("doubles", 0) if "doubles" in stats else round(hits * 0.15)
    triples = 0  # rare for pitcher chart
    singles = hits - hr - doubles - triples

    # If battersFaced not available, estimate from IP
    if bf <= 1 and ip > 0:
        bf = round(ip * 3 + hits + bb)

    # Pitcher charts: more outs, fewer hits
    so_slots = clamp(round(so / bf * 20), 2, 10)
    bb_slots = clamp(round(bb / bf * 20), 0, 4)
    hr_slots = clamp(round(hr / bf * 20), 0, 2)
    double_slots = clamp(round(doubles / bf * 20), 0, 2)
    single_slots = clamp(round(singles / bf * 20), 0, 4)

    hit_walk_slots = so_slots + bb_slots + hr_slots + double_slots + single_slots
    remaining = 20 - hit_walk_slots

    if remaining < 0:
        over = -remaining
        reduce = min(over, single_slots)
        single_slots -= reduce
        over -= reduce
        if over > 0:
            reduce = min(over, bb_slots)
            bb_slots -= reduce
            over -= reduce
        remaining = 0

    # Remaining are GB/FB outs
    gb_slots = remaining // 2 + remaining % 2
    fb_slots = remaining - gb_slots

    # No DP on charts — DP is auto-triggered when GB with runner on 1st and <2 outs

    # Build chart: hits on low rolls, outs on high rolls
    chart = {}
    slot = 1
    for result, count in [
        ("HR", hr_slots), ("2B", double_slots), ("1B", single_slots),
        ("BB", bb_slots), ("FB", fb_slots), ("GB", gb_slots),
        ("SO", so_slots)
    ]:
        for _ in range(count):
            if slot <= 20:
                chart[slot] = result
                slot += 1

    while slot <= 20:
        chart[slot] = "SO"
        slot += 1

    return chart


def calc_batter_points(on_base, speed, hr_rate, fielding):
    """Calculate point value for a batter."""
    speed_bonus = {"A": 80, "B": 40, "C": 0}
    pts = (on_base * 40) + speed_bonus.get(speed, 0) + (hr_rate * 200) + (fielding * 10)
    return clamp(round(pts), 80, 700)


def calc_pitcher_points(control, ip_rating, so_rate, hr_rate):
    """Calculate point value for a pitcher."""
    pts = (control * 50) + (so_rate * 100) + (ip_rating * 20) - (hr_rate * 150)
    return clamp(round(pts), 80, 700)


def assign_rarity(points):
    """Assign rarity based on point value."""
    if points >= 500:
        return "foil"
    elif points >= 350:
        return "rare"
    elif points >= 200:
        return "uncommon"
    return "common"


def process_team(team_info, season):
    """Process a single MLB team into Showdown cards."""
    team_id = team_info["id"]
    team_abbr = team_info["abbr"]
    team_name = team_info["name"]
    primary_color = team_info["colors"][0]

    print(f"  Processing {team_name}...")

    roster = get_roster(team_id, season)
    if not roster:
        print(f"    WARNING: No roster found for {team_name}")
        return []

    cards = []
    pitchers = []
    position_players = []

    for entry in roster:
        player_id = entry.get("person", {}).get("id")
        if not player_id:
            continue

        pos_code = entry.get("position", {}).get("abbreviation", "")
        pos_type = entry.get("position", {}).get("type", "")
        showdown_pos = POSITION_MAP.get(pos_code, "DH")

        # Get player info
        info = get_player_info(player_id)
        if not info:
            continue

        full_name = info.get("fullFMLName", info.get("fullName", "Unknown"))
        # Use useName + lastName for display
        use_name = info.get("useName", info.get("firstName", ""))
        last_name = info.get("lastName", "")
        display_name = f"{use_name} {last_name}".strip() or full_name

        bats = info.get("batSide", {}).get("code", "R")
        throws = info.get("pitchHand", {}).get("code", "R")

        is_pitcher = pos_type == "Pitcher" or showdown_pos in ("SP", "RP")

        if is_pitcher:
            stats = get_player_stats(player_id, "pitching", season)
            if not stats:
                continue

            ip_str = stats.get("inningsPitched", "0")
            ip = float(ip_str) if ip_str else 0

            # Skip pitchers with very little work
            if ip < 15:
                continue

            gs = stats.get("gamesStarted", 0)
            bb = stats.get("baseOnBalls", 0)
            so = stats.get("strikeOuts", 0)
            hr = stats.get("homeRuns", 0)
            era = stats.get("era", "4.50")
            if isinstance(era, str):
                era = float(era) if era else 4.50
            whip_str = stats.get("whip", "1.30")
            if isinstance(whip_str, str):
                whip = float(whip_str) if whip_str else 1.30
            else:
                whip = whip_str or 1.30

            bb9 = bb / max(ip, 1) * 9
            so_rate = so / max(ip, 1) * 9
            hr_rate = hr / max(ip, 1) * 9

            # Determine SP vs RP
            if gs >= 5:
                showdown_pos = "SP"
            else:
                showdown_pos = "RP"

            control = calc_control(bb9, whip)
            ip_rating = calc_ip_rating(ip, gs)
            points = calc_pitcher_points(control, ip_rating, so_rate / 9, hr_rate / 9)

            card = {
                "id": f"player-{player_id}",
                "name": display_name,
                "year": season,
                "team": team_abbr,
                "teamColor": primary_color,
                "position": showdown_pos,
                "throws": throws,
                "bats": bats,
                "points": points,
                "rarity": assign_rarity(points),
                "headshotUrl": f"/images/players/{player_id}.png",
                "mlbPlayerId": player_id,
                "control": control,
                "ip": ip_rating,
                "pitcherChart": generate_pitcher_chart(stats),
            }
            pitchers.append((card, ip if showdown_pos == "SP" else 0, stats.get("saves", 0)))
        else:
            stats = get_player_stats(player_id, "hitting", season)
            if not stats:
                continue

            pa = stats.get("plateAppearances", 0)
            if pa < 50:
                continue

            ab = stats.get("atBats", 0) or 1
            obp = stats.get("obp", ".300")
            if isinstance(obp, str):
                obp = float(obp) if obp else 0.300

            hr = stats.get("homeRuns", 0)
            sb = stats.get("stolenBases", 0)
            cs = stats.get("caughtStealing", 0)
            games = stats.get("gamesPlayed", 0)

            on_base = calc_onbase(obp)
            speed = calc_speed(sb, cs, games)
            fielding = calc_fielding(showdown_pos)
            arm = calc_arm(showdown_pos)
            hr_rate = hr / ab
            points = calc_batter_points(on_base, speed, hr_rate, fielding)

            card = {
                "id": f"player-{player_id}",
                "name": display_name,
                "year": season,
                "team": team_abbr,
                "teamColor": primary_color,
                "position": showdown_pos,
                "throws": throws,
                "bats": bats,
                "points": points,
                "rarity": assign_rarity(points),
                "headshotUrl": f"/images/players/{player_id}.png",
                "mlbPlayerId": player_id,
                "onBase": on_base,
                "speed": speed,
                "fielding": fielding,
                "arm": arm,
                "batterChart": generate_batter_chart(stats),
            }
            position_players.append((card, pa))

    # Select best 20 players
    # Sort pitchers: SP by IP desc, RP by saves desc
    sp_list = sorted([p for p in pitchers if p[0]["position"] == "SP"], key=lambda x: -x[1])
    rp_list = sorted([p for p in pitchers if p[0]["position"] == "RP"], key=lambda x: -x[2])

    selected_sp = [p[0] for p in sp_list[:5]]
    selected_rp = [p[0] for p in rp_list[:3]]

    # Sort position players by PA desc (more playing time = starter)
    position_players.sort(key=lambda x: -x[1])

    # Fill position slots
    needed_positions = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"]
    selected_pos = []
    used_ids = set()

    # First pass: fill each position with best available
    for pos in needed_positions:
        for pp, pa in position_players:
            if pp["id"] not in used_ids and pp["position"] == pos:
                selected_pos.append(pp)
                used_ids.add(pp["id"])
                break

    # Second pass: fill remaining with best available regardless of position
    for pos in needed_positions:
        if not any(p["position"] == pos for p in selected_pos):
            for pp, pa in position_players:
                if pp["id"] not in used_ids:
                    pp_copy = dict(pp)
                    pp_copy["position"] = pos
                    selected_pos.append(pp_copy)
                    used_ids.add(pp["id"])
                    break

    # Add bench players (next best 3)
    bench = []
    for pp, pa in position_players:
        if pp["id"] not in used_ids and len(bench) < 3:
            bench.append(pp)
            used_ids.add(pp["id"])

    # Fill shortages with minimum cards if needed
    while len(selected_sp) < 5:
        selected_sp.append(make_filler_pitcher("SP", team_abbr, primary_color, season, len(selected_sp)))
    while len(selected_rp) < 3:
        selected_rp.append(make_filler_pitcher("RP", team_abbr, primary_color, season, len(selected_rp)))

    all_selected = selected_sp + selected_rp + selected_pos + bench

    print(f"    Selected {len(all_selected)} cards ({len(selected_sp)} SP, {len(selected_rp)} RP, {len(selected_pos)} pos, {len(bench)} bench)")

    return all_selected


def make_filler_pitcher(pos, team_abbr, color, season, idx):
    """Create a minimum-tier filler pitcher card."""
    return {
        "id": f"filler-{pos.lower()}-{team_abbr.lower()}-{idx}",
        "name": f"{team_abbr} {pos} #{idx + 1}",
        "year": season,
        "team": team_abbr,
        "teamColor": color,
        "position": pos,
        "throws": "R",
        "bats": "R",
        "points": 100,
        "rarity": "common",
        "headshotUrl": "",
        "mlbPlayerId": 0,
        "control": 2,
        "ip": 5 if pos == "SP" else 1,
        "pitcherChart": {i: ("SO" if i >= 15 else "GB" if i >= 9 else "FB" if i >= 6 else "1B" if i >= 3 else "BB") for i in range(1, 21)},
    }


def card_to_typescript(card):
    """Convert a card dict to a TypeScript object string."""
    lines = []
    lines.append("  {")

    for key, val in card.items():
        if key in ("batterChart", "pitcherChart"):
            chart_entries = ", ".join(f'{k}: "{v}"' for k, v in sorted(val.items(), key=lambda x: int(x[0])))
            lines.append(f'    {key}: {{ {chart_entries} }},')
        elif isinstance(val, str):
            lines.append(f'    {key}: "{val}",')
        elif isinstance(val, bool):
            lines.append(f'    {key}: {"true" if val else "false"},')
        else:
            lines.append(f'    {key}: {val},')

    lines.append("  }")
    return "\n".join(lines)


def write_team_file(cards, team_abbr, team_name, output_dir):
    """Write a TypeScript file for a single team's cards."""
    safe_name = team_abbr.lower().replace(" ", "")
    filepath = output_dir / "teams" / f"{safe_name}.ts"

    ts_cards = ",\n".join(card_to_typescript(c) for c in cards)

    content = f"""// Auto-generated from MLB Stats API — {team_name}
import type {{ PlayerCard }} from '../../types';

export const {safe_name}Cards: PlayerCard[] = [
{ts_cards}
];
"""
    filepath.write_text(content, encoding="utf-8")


def write_all_cards_index(all_teams, output_dir):
    """Write the master allCards.ts index file."""
    imports = []
    exports = []

    for team_abbr, team_name, _ in all_teams:
        safe_name = team_abbr.lower().replace(" ", "")
        imports.append(f"import {{ {safe_name}Cards }} from './teams/{safe_name}';")
        exports.append(f"  ...{safe_name}Cards,")

    content = "// Auto-generated master card index\n"
    content += "import type { PlayerCard } from '../../types';\n"
    content += "\n".join(imports)
    content += f"""

export const allCards: PlayerCard[] = [
{chr(10).join(exports)}
];

export const getCardsByTeam = (teamAbbr: string): PlayerCard[] =>
  allCards.filter(c => c.team === teamAbbr);

export const getCardById = (id: string): PlayerCard | undefined =>
  allCards.find(c => c.id === id);
"""
    (output_dir / "allCards.ts").write_text(content, encoding="utf-8")


def write_teams_metadata(output_dir):
    """Write teams.ts with all 30 team metadata."""
    teams = []
    for div_name, div_teams in DIVISIONS.items():
        for t in div_teams:
            teams.append(f"""  {{
    id: {t['id']},
    name: "{t['name']}",
    abbr: "{t['abbr']}",
    division: "{div_name}",
    primaryColor: "{t['colors'][0]}",
    secondaryColor: "{t['colors'][1]}",
    logoUrl: "https://www.mlbstatic.com/team-logos/{t['id']}.svg",
  }}""")

    content = f"""// Auto-generated MLB team metadata
export interface TeamMeta {{
  id: number;
  name: string;
  abbr: string;
  division: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}}

export const teams: TeamMeta[] = [
{','.join(teams)}
];

export const getTeamByAbbr = (abbr: string): TeamMeta | undefined =>
  teams.find(t => t.abbr === abbr);

export const getTeamsByDivision = (division: string): TeamMeta[] =>
  teams.filter(t => t.division === division);

export const divisions = {json.dumps(list(DIVISIONS.keys()))};
"""
    parent = output_dir.parent
    (parent / "teams.ts").write_text(content, encoding="utf-8")


def write_types_file(src_dir):
    """Write the shared TypeScript types file."""
    content = """// Core game types

export type AtBatResult =
  | 'SO' | 'GB' | 'FB' | 'DP'
  | 'BB' | '1B' | '2B' | '3B' | 'HR';

export type OutcomeChart = Record<number, AtBatResult>; // keys 1-20

export type Position = 'SP' | 'RP' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
export type BatSide = 'R' | 'L' | 'S';
export type ThrowHand = 'R' | 'L';
export type Speed = 'A' | 'B' | 'C';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'foil';

export interface PlayerCard {
  id: string;
  name: string;
  year: number;
  team: string;
  teamColor: string;
  position: Position;
  throws: ThrowHand;
  bats: BatSide;
  points: number;
  rarity: Rarity;
  headshotUrl: string;
  mlbPlayerId: number;
  seasonsRemaining?: number;

  // Pitchers only
  control?: number;       // 0-6
  ip?: number;            // innings effective
  pitcherChart?: OutcomeChart;

  // Batters only
  onBase?: number;        // 7-16
  speed?: Speed;
  fielding?: number;      // 1-5
  arm?: number;           // 1-5
  batterChart?: OutcomeChart;
}
"""
    (src_dir / "types.ts").write_text(content, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Generate MLB Showdown card data from MLB Stats API")
    parser.add_argument("--season", type=int, default=2025, help="MLB season year (default: 2025)")
    parser.add_argument("--output", type=str, default=None, help="Output directory (default: src/data/cards)")
    args = parser.parse_args()

    # Resolve paths
    project_root = Path(__file__).resolve().parent.parent
    src_dir = project_root / "src"
    output_dir = Path(args.output) if args.output else src_dir / "data" / "cards"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "teams").mkdir(parents=True, exist_ok=True)

    print(f"MLB Showdown Card Generator")
    print(f"Season: {args.season}")
    print(f"Output: {output_dir}")
    print()

    # Write types file
    print("Writing TypeScript types...")
    write_types_file(src_dir)

    # Process all 30 teams
    all_teams_data = []
    total_cards = 0

    for div_name, div_teams in DIVISIONS.items():
        print(f"\n{div_name}:")
        for team_info in div_teams:
            cards = process_team(team_info, args.season)
            if cards:
                write_team_file(cards, team_info["abbr"], team_info["name"], output_dir)
                all_teams_data.append((team_info["abbr"], team_info["name"], cards))
                total_cards += len(cards)
            # Be respectful to the API
            time.sleep(0.2)

    # Write master index
    print(f"\nWriting master card index ({total_cards} total cards)...")
    write_all_cards_index(all_teams_data, output_dir)

    # Write team metadata
    print("Writing team metadata...")
    write_teams_metadata(output_dir)

    # Summary
    print(f"\nDone! Generated {total_cards} cards across {len(all_teams_data)} teams.")

    # Rarity breakdown
    rarities = {"common": 0, "uncommon": 0, "rare": 0, "foil": 0}
    for _, _, cards in all_teams_data:
        for c in cards:
            rarities[c["rarity"]] += 1

    print(f"Rarity breakdown: {json.dumps(rarities)}")


if __name__ == "__main__":
    main()
