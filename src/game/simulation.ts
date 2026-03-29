/**
 * Headless game simulation — runs a complete game without UI.
 * Used for CPU vs CPU games in franchise mode and for testing.
 *
 * Pure TypeScript, no React dependencies.
 */

import type { PlayerCard } from '../types';
import { createRandomRng, createSeededRng, type DiceRng } from './dice';
import { resolveAtBat, getResultDescription } from './engine';
import { attemptSteal, type Bases } from './baserunning';
import {
  createGameState,
  startGame,
  recordAtBatResult,
  startNextHalfInning,
  getCurrentBatter,
  getCurrentPitcher,
  getBattingTeam,
  getInningsPitchedInGame,
  isGameOver,
  getWinner,
  type GameState,
} from './stateMachine';

export interface SimulationResult {
  finalState: GameState;
  winner: 'away' | 'home' | null;
  awayScore: number;
  homeScore: number;
  innings: number;
}

/**
 * Simulate a complete game headlessly.
 */
export function simulateGame(
  awayName: string,
  awayLineup: PlayerCard[],
  awayPitching: PlayerCard[],
  homeName: string,
  homeLineup: PlayerCard[],
  homePitching: PlayerCard[],
  seed?: number,
): SimulationResult {
  const rng = seed != null ? createSeededRng(seed) : createRandomRng();
  let state = createGameState(awayName, awayLineup, awayPitching, homeName, homeLineup, homePitching);
  state = startGame(state);

  let maxAtBats = 500; // safety valve to prevent infinite loops

  while (!isGameOver(state) && maxAtBats-- > 0) {
    if (state.phase === 'half_inning_end') {
      state = startNextHalfInning(state);
      continue;
    }

    if (state.phase !== 'pre_at_bat') {
      // Shouldn't happen in simulation, but safety
      break;
    }

    const batter = getCurrentBatter(state);
    const pitcher = getCurrentPitcher(state);
    const inningsPitched = getInningsPitchedInGame(state, pitcher.id);

    // Resolve the at-bat
    const pitchRoll = rng.roll();
    const swingRoll = rng.roll();

    const outcome = resolveAtBat(
      pitcher,
      batter,
      pitchRoll,
      swingRoll,
      inningsPitched,
      state.bases,
      state.outs,
    );

    const description = `${batter.name}: ${getResultDescription(outcome.swing.result)}`;

    state = recordAtBatResult(
      state,
      outcome.swing.result,
      outcome.baserunning.runsScored,
      outcome.baserunning.bases,
      outcome.baserunning.outs,
      description,
    );
  }

  return {
    finalState: state,
    winner: getWinner(state),
    awayScore: state.away.score,
    homeScore: state.home.score,
    innings: state.inning,
  };
}

/**
 * Format a simulation result as a box score string.
 */
export function formatBoxScore(state: GameState): string {
  const { away, home } = state;
  const maxInnings = Math.max(away.inningRuns.length, home.inningRuns.length);

  // Header
  let header = '         ';
  for (let i = 1; i <= maxInnings; i++) {
    header += ` ${String(i).padStart(2)}`;
  }
  header += '   R  H  E';

  // Away line
  let awayLine = away.name.padEnd(9);
  for (let i = 0; i < maxInnings; i++) {
    awayLine += ` ${String(away.inningRuns[i] ?? 0).padStart(2)}`;
  }
  awayLine += `  ${String(away.score).padStart(2)} ${String(away.hits).padStart(2)} ${String(away.errors).padStart(2)}`;

  // Home line
  let homeLine = home.name.padEnd(9);
  for (let i = 0; i < maxInnings; i++) {
    homeLine += ` ${String(home.inningRuns[i] ?? 0).padStart(2)}`;
  }
  homeLine += `  ${String(home.score).padStart(2)} ${String(home.hits).padStart(2)} ${String(home.errors).padStart(2)}`;

  return `${header}\n${awayLine}\n${homeLine}`;
}
