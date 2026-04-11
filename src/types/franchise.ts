/**
 * Franchise mode types — all interfaces for franchise saves,
 * rosters, schedules, standings, and stats.
 *
 * Pure TypeScript, no React dependencies.
 */


export type Difficulty = 'easy' | 'medium' | 'hard';
export type SeasonLength = 10 | 30 | 50;
export type StartMode = 'preset' | 'packDraft' | 'teamBuilder';
export type FranchiseTab = 'schedule' | 'standings' | 'roster' | 'leaders' | 'awards' | 'history';

// ── Franchise Save (top-level persisted object) ────────────────────

export interface FranchiseSave {
  id: string;
  name: string;
  createdAt: number;
  startMode: StartMode;
  difficulty: Difficulty;
  currentSeason: number;
  seasonLength: SeasonLength;
  currentDay: number; // 1-based index into schedule
  userTeamAbbr: string;
  rosters: Record<string, FranchiseRoster>; // keyed by team abbr
  schedule: ScheduleDay[];
  seasonStats: Record<string, PlayerSeasonStats>; // keyed by player ID
  awards: AwardRecord[];
  playoffs: PlayoffBracket | null;
  history: SeasonHistory[];
}

// ── Roster ─────────────────────────────────────────────────────────

export interface FranchiseRoster {
  teamAbbr: string;
  lineup: string[];           // 9 card IDs in batting order
  bench: string[];            // up to 3 card IDs
  startingPitchers: string[]; // 5 card IDs in rotation order
  reliefPitchers: string[];   // up to 3 card IDs
  lastStarterUsed: string | null;
}

// ── Schedule ───────────────────────────────────────────────────────

export interface ScheduleDay {
  dayNumber: number;
  games: ScheduledGame[];
}

export interface ScheduledGame {
  id: string;
  awayTeamAbbr: string;
  homeTeamAbbr: string;
  status: 'upcoming' | 'completed';
  result?: GameResult;
}

export interface GameResult {
  awayScore: number;
  homeScore: number;
  winnerAbbr: string;
  loserAbbr: string;
  innings: number;
  highlights?: string[];
}

// ── Standings (computed, not stored) ───────────────────────────────

export interface StandingsRow {
  teamAbbr: string;
  division: string;
  wins: number;
  losses: number;
  pct: number;
  gamesBack: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
}

// ── Player Stats ───────────────────────────────────────────────────

export interface PlayerSeasonStats {
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
  runs: number;
  sb: number;
  // Pitching
  gamesStarted: number;
  gamesRelieved: number;
  inningsPitched: number;
  hitsAllowed: number;
  bbAllowed: number;
  soRecorded: number;
  hrAllowed: number;
  wins: number;
  losses: number;
  runsAllowed: number;
}

// ── Awards ──────────────────────────────────────────────────────────

export interface AwardRecord {
  season: number;
  type: 'mvp' | 'cyYoung' | 'battingTitle' | 'hrLeader' | 'sbLeader' | 'worldSeries';
  playerId: string;
  playerName: string;
  teamAbbr: string;
  statLine: string;
}

// ── Playoffs ────────────────────────────────────────────────────────

export interface PlayoffBracket {
  seeds: PlayoffSeed[];
  rounds: PlayoffRound[];
}

export interface PlayoffSeed {
  seed: number;
  teamAbbr: string;
  wins: number;
  losses: number;
}

export interface PlayoffRound {
  name: 'Divisional' | 'Championship' | 'World Series';
  matchups: PlayoffMatchup[];
}

export interface PlayoffMatchup {
  id: string;
  higherSeed: string; // team abbr
  lowerSeed: string;
  higherSeedWins: number;
  lowerSeedWins: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  winnerAbbr?: string;
  games: GameResult[];
}

// ── Season History ──────────────────────────────────────────────────

export interface SeasonHistory {
  season: number;
  userRecord: { wins: number; losses: number };
  champion: string; // team abbr
  awards: AwardRecord[];
}

// ── Setup Config ────────────────────────────────────────────────────

export interface CreateFranchiseConfig {
  name: string;
  userTeamAbbr: string;
  seasonLength: SeasonLength;
  difficulty: Difficulty;
  startMode: StartMode;
}

export function createEmptySeasonStats(
  playerId: string,
  playerName: string,
  teamAbbr: string,
): PlayerSeasonStats {
  return {
    playerId, playerName, teamAbbr,
    pa: 0, ab: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0,
    bb: 0, so: 0, rbi: 0, runs: 0, sb: 0,
    gamesStarted: 0, gamesRelieved: 0, inningsPitched: 0,
    hitsAllowed: 0, bbAllowed: 0, soRecorded: 0, hrAllowed: 0,
    wins: 0, losses: 0, runsAllowed: 0,
  };
}
