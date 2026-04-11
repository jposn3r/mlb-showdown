/**
 * Stats tracker — extracts per-player stats from completed games
 * and merges them into franchise season totals.
 *
 * Pure TypeScript, no React dependencies.
 */

import type { GameState } from './stateMachine';
import type { PlayerSeasonStats } from '../types/franchise';
import { createEmptySeasonStats } from '../types/franchise';

interface PlayerGameStats {
  playerId: string;
  playerName: string;
  teamAbbr: string;
  // Batting
  pa: number;
  ab: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  bb: number;
  so: number;
  rbi: number;
  // Pitching
  isPitcher: boolean;
  inningsPitched: number;
  hitsAllowed: number;
  bbAllowed: number;
  soRecorded: number;
  hrAllowed: number;
  runsAllowed: number;
}

/**
 * Extract per-player stats from a completed game's log.
 */
export function extractStatsFromGame(
  finalState: GameState,
  awayTeamAbbr: string,
  homeTeamAbbr: string,
): PlayerGameStats[] {
  const statsMap = new Map<string, PlayerGameStats>();

  const getOrCreate = (id: string, name: string, teamAbbr: string): PlayerGameStats => {
    if (!statsMap.has(id)) {
      statsMap.set(id, {
        playerId: id, playerName: name, teamAbbr,
        pa: 0, ab: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0,
        bb: 0, so: 0, rbi: 0,
        isPitcher: false, inningsPitched: 0,
        hitsAllowed: 0, bbAllowed: 0, soRecorded: 0, hrAllowed: 0, runsAllowed: 0,
      });
    }
    return statsMap.get(id)!;
  };

  // Track pitcher half-innings for IP calculation
  const pitcherHalfInnings = new Map<string, Set<string>>();

  for (const entry of finalState.gameLog) {
    const batterTeam = entry.halfInning === 'top' ? awayTeamAbbr : homeTeamAbbr;
    const pitcherTeam = entry.halfInning === 'top' ? homeTeamAbbr : awayTeamAbbr;

    // Batter stats
    const batter = getOrCreate(entry.batterId, entry.batterName, batterTeam);
    batter.pa++;
    batter.rbi += entry.runsScored;

    const result = entry.result;
    if (result === 'BB') {
      batter.bb++;
    } else {
      batter.ab++;
      if (result === '1B') { batter.hits++; batter.singles++; }
      else if (result === '2B') { batter.hits++; batter.doubles++; }
      else if (result === '3B') { batter.hits++; batter.triples++; }
      else if (result === 'HR') { batter.hits++; batter.hr++; }
      else if (result === 'SO') { batter.so++; }
    }

    // Pitcher stats
    const pitcher = getOrCreate(entry.pitcherId, entry.pitcherName, pitcherTeam);
    pitcher.isPitcher = true;

    // Track half-innings pitched
    const hiKey = `${entry.inning}-${entry.halfInning}`;
    if (!pitcherHalfInnings.has(entry.pitcherId)) {
      pitcherHalfInnings.set(entry.pitcherId, new Set());
    }
    pitcherHalfInnings.get(entry.pitcherId)!.add(hiKey);

    // Hits/walks/SOs allowed
    if (['1B', '2B', '3B', 'HR'].includes(result)) {
      pitcher.hitsAllowed++;
    }
    if (result === 'HR') pitcher.hrAllowed++;
    if (result === 'BB') pitcher.bbAllowed++;
    if (result === 'SO') pitcher.soRecorded++;
    pitcher.runsAllowed += entry.runsScored;
  }

  // Assign IP from half-inning counts
  for (const [pitcherId, his] of pitcherHalfInnings) {
    const stats = statsMap.get(pitcherId);
    if (stats) {
      stats.inningsPitched = his.size;
    }
  }

  return Array.from(statsMap.values());
}

/**
 * Merge a single game's player stats into the franchise season stats record.
 */
export function mergeGameStats(
  seasonStats: Record<string, PlayerSeasonStats>,
  gameStats: PlayerGameStats[],
  winnerAbbr: string,
  _loserAbbr: string,
  awayStartingPitcherId: string,
  homeStartingPitcherId: string,
  awayTeamAbbr: string,
  _homeTeamAbbr: string,
): Record<string, PlayerSeasonStats> {
  const updated = { ...seasonStats };

  for (const gs of gameStats) {
    if (!updated[gs.playerId]) {
      updated[gs.playerId] = createEmptySeasonStats(gs.playerId, gs.playerName, gs.teamAbbr);
    }
    const s = { ...updated[gs.playerId] };

    // Batting
    s.pa += gs.pa;
    s.ab += gs.ab;
    s.hits += gs.hits;
    s.singles += gs.singles;
    s.doubles += gs.doubles;
    s.triples += gs.triples;
    s.hr += gs.hr;
    s.bb += gs.bb;
    s.so += gs.so;
    s.rbi += gs.rbi;

    // Pitching
    if (gs.isPitcher) {
      s.inningsPitched += gs.inningsPitched;
      s.hitsAllowed += gs.hitsAllowed;
      s.bbAllowed += gs.bbAllowed;
      s.soRecorded += gs.soRecorded;
      s.hrAllowed += gs.hrAllowed;
      s.runsAllowed += gs.runsAllowed;
    }

    updated[gs.playerId] = s;
  }

  // Assign W/L to starting pitchers
  const awayWon = winnerAbbr === awayTeamAbbr;
  const winningStarterId = awayWon ? awayStartingPitcherId : homeStartingPitcherId;
  const losingStarterId = awayWon ? homeStartingPitcherId : awayStartingPitcherId;

  if (updated[winningStarterId]) {
    updated[winningStarterId] = {
      ...updated[winningStarterId],
      wins: updated[winningStarterId].wins + 1,
      gamesStarted: updated[winningStarterId].gamesStarted + 1,
    };
  }
  if (updated[losingStarterId]) {
    updated[losingStarterId] = {
      ...updated[losingStarterId],
      losses: updated[losingStarterId].losses + 1,
      gamesStarted: updated[losingStarterId].gamesStarted + 1,
    };
  }

  return updated;
}
