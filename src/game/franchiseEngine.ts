/**
 * Franchise engine — schedule generation, standings computation,
 * roster initialization, and pitcher rotation.
 *
 * Pure TypeScript, no React dependencies.
 */

import type { PlayerCard } from '../types';
import { allCards } from '../data/cards/allCards';
import { teams, divisions } from '../data/teams';
import type {
  FranchiseRoster, ScheduleDay, ScheduledGame, StandingsRow, SeasonLength,
} from '../types/franchise';

// ── Seeded RNG (mulberry32) ────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Schedule Generation ────────────────────────────────────────────

/**
 * Generate the full season schedule.
 * Each day: 15 games (all 30 teams play). User's game + 14 CPU games.
 * Division rivals are weighted 2x for opponent selection.
 */
export function generateSchedule(
  seasonLength: SeasonLength,
  userTeamAbbr: string,
  seed: number,
): ScheduleDay[] {
  const rng = mulberry32(seed);
  const allAbbrs = teams.map(t => t.abbr);
  const userTeam = teams.find(t => t.abbr === userTeamAbbr)!;
  const userDivision = userTeam.division;

  // Build weighted opponent pool for user (division rivals 2x)
  const userOpponents: string[] = [];
  for (const abbr of allAbbrs) {
    if (abbr === userTeamAbbr) continue;
    const team = teams.find(t => t.abbr === abbr)!;
    userOpponents.push(abbr);
    if (team.division === userDivision) {
      userOpponents.push(abbr); // double weight
    }
  }

  const schedule: ScheduleDay[] = [];
  let lastUserOpponent = '';
  let userHomeCount = 0;

  for (let day = 1; day <= seasonLength; day++) {
    // Pick user's opponent (avoid back-to-back same opponent)
    let opponentIdx: number;
    let opponent: string;
    let attempts = 0;
    do {
      opponentIdx = Math.floor(rng() * userOpponents.length);
      opponent = userOpponents[opponentIdx];
      attempts++;
    } while (opponent === lastUserOpponent && attempts < 20);
    lastUserOpponent = opponent;

    // Decide home/away for user (roughly 50/50)
    const targetHomeRatio = day / 2;
    const isUserHome = userHomeCount < targetHomeRatio ? rng() < 0.6 : rng() < 0.4;
    if (isUserHome) userHomeCount++;

    const userGame: ScheduledGame = {
      id: `day${day}-game0`,
      awayTeamAbbr: isUserHome ? opponent : userTeamAbbr,
      homeTeamAbbr: isUserHome ? userTeamAbbr : opponent,
      status: 'upcoming',
    };

    // Pair remaining 28 teams for CPU games
    const remaining = allAbbrs.filter(a => a !== userTeamAbbr && a !== opponent);
    const shuffled = seededShuffle(remaining, rng);
    const cpuGames: ScheduledGame[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const isFirstHome = rng() > 0.5;
      cpuGames.push({
        id: `day${day}-game${Math.floor(i / 2) + 1}`,
        awayTeamAbbr: isFirstHome ? shuffled[i + 1] : shuffled[i],
        homeTeamAbbr: isFirstHome ? shuffled[i] : shuffled[i + 1],
        status: 'upcoming',
      });
    }

    schedule.push({
      dayNumber: day,
      games: [userGame, ...cpuGames],
    });
  }

  return schedule;
}

// ── Roster Initialization ──────────────────────────────────────────

/**
 * Build a default roster for any team from card data.
 * Picks the best 9 position players (by points), 3 bench,
 * up to 5 SP and up to 3 RP.
 */
export function buildDefaultRoster(teamAbbr: string): FranchiseRoster {
  const teamCards = allCards.filter(c => c.team === teamAbbr);
  const sp = teamCards
    .filter(c => c.position === 'SP')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  const rp = teamCards
    .filter(c => c.position === 'RP')
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
  const batters = teamCards
    .filter(c => !['SP', 'RP'].includes(c.position))
    .sort((a, b) => b.points - a.points);

  return {
    teamAbbr,
    lineup: batters.slice(0, 9).map(c => c.id),
    bench: batters.slice(9, 12).map(c => c.id),
    startingPitchers: sp.map(c => c.id),
    reliefPitchers: rp.map(c => c.id),
    lastStarterUsed: null,
  };
}

/**
 * Build rosters for all 30 teams.
 */
export function buildAllRosters(): Record<string, FranchiseRoster> {
  const rosters: Record<string, FranchiseRoster> = {};
  for (const team of teams) {
    rosters[team.abbr] = buildDefaultRoster(team.abbr);
  }
  return rosters;
}

// ── Pitcher Rotation ───────────────────────────────────────────────

/**
 * Get the next starting pitcher in the rotation.
 * Enforces no-consecutive-starts by cycling forward.
 */
export function getNextStarter(roster: FranchiseRoster): string {
  const { startingPitchers, lastStarterUsed } = roster;
  if (startingPitchers.length === 0) return '';
  if (!lastStarterUsed) return startingPitchers[0];
  const lastIdx = startingPitchers.indexOf(lastStarterUsed);
  if (lastIdx === -1) return startingPitchers[0];
  return startingPitchers[(lastIdx + 1) % startingPitchers.length];
}

// ── Resolve Roster to Cards ────────────────────────────────────────

const cardIndex = new Map<string, PlayerCard>();
for (const card of allCards) {
  cardIndex.set(card.id, card);
}

export function getCardById(id: string): PlayerCard | undefined {
  return cardIndex.get(id);
}

/**
 * Resolve a franchise roster into lineup and pitching arrays of PlayerCards.
 * The starting pitcher is placed first in the pitching array.
 */
export function resolveRoster(
  roster: FranchiseRoster,
  startingPitcherId: string,
): { lineup: PlayerCard[]; pitching: PlayerCard[] } | null {
  const lineup = roster.lineup
    .map(id => cardIndex.get(id))
    .filter((c): c is PlayerCard => c != null);

  const starter = cardIndex.get(startingPitcherId);
  if (!starter) return null;

  const relievers = roster.reliefPitchers
    .map(id => cardIndex.get(id))
    .filter((c): c is PlayerCard => c != null);

  const otherStarters = roster.startingPitchers
    .filter(id => id !== startingPitcherId)
    .map(id => cardIndex.get(id))
    .filter((c): c is PlayerCard => c != null);

  return {
    lineup,
    pitching: [starter, ...relievers, ...otherStarters],
  };
}

// ── Standings Computation ──────────────────────────────────────────

/**
 * Compute standings from completed schedule results.
 * Returns rows grouped by division with GB calculated.
 */
export function computeStandings(schedule: ScheduleDay[]): StandingsRow[] {
  // Accumulate per-team records
  const records = new Map<string, {
    wins: number; losses: number; rs: number; ra: number;
  }>();

  for (const team of teams) {
    records.set(team.abbr, { wins: 0, losses: 0, rs: 0, ra: 0 });
  }

  for (const day of schedule) {
    for (const game of day.games) {
      if (game.status !== 'completed' || !game.result) continue;
      const { awayTeamAbbr, homeTeamAbbr, result } = game;

      const awayRec = records.get(awayTeamAbbr)!;
      const homeRec = records.get(homeTeamAbbr)!;

      if (result.winnerAbbr === awayTeamAbbr) {
        awayRec.wins++;
        homeRec.losses++;
      } else {
        homeRec.wins++;
        awayRec.losses++;
      }

      awayRec.rs += result.awayScore;
      awayRec.ra += result.homeScore;
      homeRec.rs += result.homeScore;
      homeRec.ra += result.awayScore;
    }
  }

  // Build rows grouped by division
  const rows: StandingsRow[] = [];

  for (const div of divisions) {
    const divTeams = teams
      .filter(t => t.division === div)
      .map(t => {
        const rec = records.get(t.abbr)!;
        const totalGames = rec.wins + rec.losses;
        return {
          teamAbbr: t.abbr,
          division: div,
          wins: rec.wins,
          losses: rec.losses,
          pct: totalGames > 0 ? rec.wins / totalGames : 0,
          gamesBack: 0,
          runsScored: rec.rs,
          runsAllowed: rec.ra,
          runDiff: rec.rs - rec.ra,
        };
      })
      .sort((a, b) => b.pct - a.pct || b.runDiff - a.runDiff);

    // Compute GB from division leader
    const leaderWins = divTeams[0]?.wins ?? 0;
    const leaderLosses = divTeams[0]?.losses ?? 0;
    for (const row of divTeams) {
      row.gamesBack = ((leaderWins - row.wins) + (row.losses - leaderLosses)) / 2;
    }

    rows.push(...divTeams);
  }

  return rows;
}

/**
 * Get a team's W-L record from standings.
 */
export function getTeamRecord(
  schedule: ScheduleDay[],
  teamAbbr: string,
): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const day of schedule) {
    for (const game of day.games) {
      if (game.status !== 'completed' || !game.result) continue;
      if (game.awayTeamAbbr !== teamAbbr && game.homeTeamAbbr !== teamAbbr) continue;
      if (game.result.winnerAbbr === teamAbbr) wins++;
      else losses++;
    }
  }
  return { wins, losses };
}

/**
 * Find the user's game for a given day.
 */
export function getUserGame(day: ScheduleDay, userTeamAbbr: string): ScheduledGame | undefined {
  return day.games.find(
    g => g.awayTeamAbbr === userTeamAbbr || g.homeTeamAbbr === userTeamAbbr,
  );
}

/**
 * Check if the user's game for the current day is completed.
 */
export function isUserGameComplete(day: ScheduleDay, userTeamAbbr: string): boolean {
  const game = getUserGame(day, userTeamAbbr);
  return game?.status === 'completed';
}
