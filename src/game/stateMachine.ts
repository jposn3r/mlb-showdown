/**
 * Game state machine — manages phases, innings, outs,
 * and transitions through a complete 9+ inning game.
 *
 * Pure TypeScript, no React dependencies.
 */

import type { PlayerCard, AtBatResult } from '../types';
import type { Bases } from './baserunning';

export type GamePhase =
  | 'pre_game'        // before first pitch
  | 'pre_at_bat'      // between at-bats (strategy card window, steal attempts)
  | 'pitch'           // waiting for pitch roll
  | 'swing'           // waiting for swing roll
  | 'result'          // showing at-bat result
  | 'half_inning_end' // 3 outs, switching sides
  | 'game_over';      // final result

export type HalfInning = 'top' | 'bottom';

export interface TeamState {
  name: string;
  cards: PlayerCard[];
  lineup: PlayerCard[];       // 9 batters in order
  pitchingStaff: PlayerCard[];
  currentPitcher: PlayerCard;
  currentBatterIndex: number; // 0-8, wraps around
  score: number;
  hits: number;
  errors: number;
  inningRuns: number[];       // runs per inning
}

export interface GameState {
  phase: GamePhase;
  inning: number;             // 1-based
  halfInning: HalfInning;
  outs: number;
  bases: Bases;
  away: TeamState;
  home: TeamState;
  gameLog: GameLogEntry[];
  isExtraInnings: boolean;
}

export interface GameLogEntry {
  inning: number;
  halfInning: HalfInning;
  batterId: string;
  batterName: string;
  pitcherId: string;
  pitcherName: string;
  result: AtBatResult;
  description: string;
  runsScored: number;
  timestamp: number;
}

/**
 * Get the batting team for the current half-inning.
 */
export function getBattingTeam(state: GameState): TeamState {
  return state.halfInning === 'top' ? state.away : state.home;
}

/**
 * Get the fielding/pitching team for the current half-inning.
 */
export function getFieldingTeam(state: GameState): TeamState {
  return state.halfInning === 'top' ? state.home : state.away;
}

/**
 * Get the current batter.
 */
export function getCurrentBatter(state: GameState): PlayerCard {
  const team = getBattingTeam(state);
  return team.lineup[team.currentBatterIndex];
}

/**
 * Get the current pitcher.
 */
export function getCurrentPitcher(state: GameState): PlayerCard {
  return getFieldingTeam(state).currentPitcher;
}

/**
 * Calculate innings pitched by the current pitcher in this game.
 * Simplified: count complete half-innings they've been in.
 */
export function getInningsPitchedInGame(state: GameState, pitcherId: string): number {
  // Count half-innings this pitcher has appeared in
  const entries = state.gameLog.filter(e => e.pitcherId === pitcherId);
  if (entries.length === 0) return 0;

  const halfInnings = new Set(entries.map(e => `${e.inning}-${e.halfInning}`));
  return halfInnings.size;
}

/**
 * Create initial game state.
 */
export function createGameState(
  awayName: string,
  awayLineup: PlayerCard[],
  awayPitchingStaff: PlayerCard[],
  homeName: string,
  homeLineup: PlayerCard[],
  homePitchingStaff: PlayerCard[],
): GameState {
  return {
    phase: 'pre_game',
    inning: 1,
    halfInning: 'top',
    outs: 0,
    bases: [null, null, null],
    away: {
      name: awayName,
      cards: [...awayLineup, ...awayPitchingStaff],
      lineup: awayLineup.slice(0, 9),
      pitchingStaff: awayPitchingStaff,
      currentPitcher: awayPitchingStaff[0],
      currentBatterIndex: 0,
      score: 0,
      hits: 0,
      errors: 0,
      inningRuns: [],
    },
    home: {
      name: homeName,
      cards: [...homeLineup, ...homePitchingStaff],
      lineup: homeLineup.slice(0, 9),
      pitchingStaff: homePitchingStaff,
      currentPitcher: homePitchingStaff[0],
      currentBatterIndex: 0,
      score: 0,
      hits: 0,
      errors: 0,
      inningRuns: [],
    },
    gameLog: [],
    isExtraInnings: false,
  };
}

/**
 * Start the game — transition from pre_game to first at-bat.
 */
export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'pre_at_bat',
    away: { ...state.away, inningRuns: [0] },
    home: { ...state.home, inningRuns: [0] },
  };
}

/**
 * Record an at-bat result and advance the game state.
 */
export function recordAtBatResult(
  state: GameState,
  result: AtBatResult,
  runsScored: string[],
  newBases: Bases,
  outsFromPlay: number,
  description: string,
): GameState {
  const battingTeam = getBattingTeam(state);
  const batter = getCurrentBatter(state);
  const pitcher = getCurrentPitcher(state);

  const isAHit = ['1B', '2B', '3B', 'HR'].includes(result);
  const newOuts = state.outs + outsFromPlay;
  const runs = runsScored.length;

  // Create log entry
  const logEntry: GameLogEntry = {
    inning: state.inning,
    halfInning: state.halfInning,
    batterId: batter.id,
    batterName: batter.name,
    pitcherId: pitcher.id,
    pitcherName: pitcher.name,
    result,
    description,
    runsScored: runs,
    timestamp: Date.now(),
  };

  // Update batting team
  const updatedBattingTeam: TeamState = {
    ...battingTeam,
    score: battingTeam.score + runs,
    hits: battingTeam.hits + (isAHit ? 1 : 0),
    currentBatterIndex: (battingTeam.currentBatterIndex + 1) % 9,
    inningRuns: [...battingTeam.inningRuns],
  };

  // Update current inning runs
  const currentInningIdx = updatedBattingTeam.inningRuns.length - 1;
  if (currentInningIdx >= 0) {
    updatedBattingTeam.inningRuns[currentInningIdx] += runs;
  }

  const newState: GameState = {
    ...state,
    outs: newOuts,
    bases: newBases,
    gameLog: [...state.gameLog, logEntry],
    away: state.halfInning === 'top' ? updatedBattingTeam : state.away,
    home: state.halfInning === 'bottom' ? updatedBattingTeam : state.home,
  };

  // Check if half-inning is over
  if (newOuts >= 3) {
    return endHalfInning(newState);
  }

  // Check walk-off (bottom of 9+ and home team takes the lead)
  if (
    state.halfInning === 'bottom' &&
    state.inning >= 9 &&
    newState.home.score > newState.away.score
  ) {
    return { ...newState, phase: 'game_over' };
  }

  newState.phase = 'pre_at_bat';
  return newState;
}

/**
 * End a half-inning: switch sides or end the game.
 */
function endHalfInning(state: GameState): GameState {
  const newState: GameState = {
    ...state,
    outs: 0,
    bases: [null, null, null],
  };

  if (state.halfInning === 'top') {
    // Switch to bottom of inning
    newState.halfInning = 'bottom';
    newState.phase = 'half_inning_end';

    // Ensure home team has a run tracker for this inning
    if (newState.home.inningRuns.length < state.inning) {
      newState.home = {
        ...newState.home,
        inningRuns: [...newState.home.inningRuns, 0],
      };
    }
  } else {
    // End of bottom: check if game is over
    if (state.inning >= 9 && newState.away.score !== newState.home.score) {
      newState.phase = 'game_over';
      return newState;
    }

    if (state.inning >= 9 && newState.away.score === newState.home.score) {
      newState.isExtraInnings = true;
    }

    // Move to next inning
    newState.inning = state.inning + 1;
    newState.halfInning = 'top';
    newState.phase = 'half_inning_end';

    // Add new inning run trackers
    newState.away = {
      ...newState.away,
      inningRuns: [...newState.away.inningRuns, 0],
    };
    newState.home = {
      ...newState.home,
      inningRuns: [...newState.home.inningRuns, 0],
    };
  }

  return newState;
}

/**
 * Transition from half_inning_end to next at-bat.
 */
export function startNextHalfInning(state: GameState): GameState {
  return { ...state, phase: 'pre_at_bat' };
}

/**
 * Change the pitcher for the fielding team.
 */
export function changePitcher(state: GameState, newPitcher: PlayerCard): GameState {
  const fieldingTeam = getFieldingTeam(state);
  const updatedTeam: TeamState = {
    ...fieldingTeam,
    currentPitcher: newPitcher,
  };

  return {
    ...state,
    away: state.halfInning === 'top' ? state.away : updatedTeam,
    home: state.halfInning === 'top' ? updatedTeam : state.home,
  };
}

/**
 * Check if the game is over.
 */
export function isGameOver(state: GameState): boolean {
  return state.phase === 'game_over';
}

/**
 * Get the winner of a finished game.
 */
export function getWinner(state: GameState): 'away' | 'home' | null {
  if (!isGameOver(state)) return null;
  if (state.away.score > state.home.score) return 'away';
  if (state.home.score > state.away.score) return 'home';
  return null; // shouldn't happen — game continues until someone wins
}
