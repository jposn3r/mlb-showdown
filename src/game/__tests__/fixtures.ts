/**
 * Shared test fixtures for game engine tests.
 */

import type { PlayerCard, OutcomeChart } from '../../types';
import type { GameState } from '../stateMachine';
import { createGameState, startGame } from '../stateMachine';

// ── Sample Charts ─────────────────────────────────────────────────

const samplePitcherChart: OutcomeChart = {
  1: 'HR', 2: '2B', 3: '1B', 4: '1B', 5: 'BB', 6: 'BB',
  7: 'FB', 8: 'FB', 9: 'FB', 10: 'FB',
  11: 'GB', 12: 'GB', 13: 'GB', 14: 'GB', 15: 'GB',
  16: 'SO', 17: 'SO', 18: 'SO', 19: 'SO', 20: 'SO',
};

const sampleBatterChart: OutcomeChart = {
  1: 'HR', 2: 'HR', 3: '3B', 4: '2B', 5: '2B',
  6: '1B', 7: '1B', 8: '1B', 9: 'BB', 10: 'BB',
  11: 'FB', 12: 'FB', 13: 'FB', 14: 'GB', 15: 'GB',
  16: 'GB', 17: 'SO', 18: 'SO', 19: 'SO', 20: 'SO',
};

// ── Sample Cards ──────────────────────────────────────────────────

export function makePitcher(overrides: Partial<PlayerCard> = {}): PlayerCard {
  return {
    id: 'pitcher-1',
    name: 'Test Pitcher',
    year: 2025,
    team: 'NYY',
    teamColor: '#003087',
    position: 'SP',
    throws: 'R',
    bats: 'R',
    points: 400,
    rarity: 'rare',
    headshotUrl: '',
    mlbPlayerId: 1,
    control: 4,
    ip: 6,
    pitcherChart: samplePitcherChart,
    ...overrides,
  };
}

export function makeBatter(overrides: Partial<PlayerCard> = {}): PlayerCard {
  return {
    id: 'batter-1',
    name: 'Test Batter',
    year: 2025,
    team: 'BOS',
    teamColor: '#BD3039',
    position: 'CF',
    throws: 'R',
    bats: 'R',
    points: 350,
    rarity: 'uncommon',
    headshotUrl: '',
    mlbPlayerId: 2,
    onBase: 10,
    speed: 'B',
    fielding: 3,
    arm: 3,
    batterChart: sampleBatterChart,
    ...overrides,
  };
}

// ── Lineup Helpers ────────────────────────────────────────────────

export function makeLineup(teamPrefix: string = 'away'): PlayerCard[] {
  return Array.from({ length: 9 }, (_, i) =>
    makeBatter({
      id: `${teamPrefix}-batter-${i}`,
      name: `${teamPrefix} Batter ${i + 1}`,
      onBase: 9 + (i % 3), // vary onBase 9-11
    }),
  );
}

export function makePitchingStaff(teamPrefix: string = 'away'): PlayerCard[] {
  return Array.from({ length: 5 }, (_, i) =>
    makePitcher({
      id: `${teamPrefix}-pitcher-${i}`,
      name: `${teamPrefix} Pitcher ${i + 1}`,
      control: 3 + (i % 3), // vary control 3-5
    }),
  );
}

// ── Game State Helper ─────────────────────────────────────────────

export function makeStartedGame(): GameState {
  const awayLineup = makeLineup('away');
  const awayPitching = makePitchingStaff('away');
  const homeLineup = makeLineup('home');
  const homePitching = makePitchingStaff('home');

  const state = createGameState(
    'Away Team', awayLineup, awayPitching,
    'Home Team', homeLineup, homePitching,
  );
  return startGame(state);
}
