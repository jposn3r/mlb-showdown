/**
 * Game state store — manages the active game session.
 * Wraps the pure game engine with Zustand reactivity.
 */

import { create } from 'zustand';
import type { PlayerCard, AtBatResult } from '../types';
import { rollD20 } from '../game/dice';
import {
  resolvePitch, resolveSwing, type PitchResult, type SwingResult, type Advantage,
} from '../game/engine';
import { advanceRunners, attemptSteal, type Bases } from '../game/baserunning';
import {
  createGameState, startGame, recordAtBatResult, startNextHalfInning,
  changePitcher, getCurrentBatter, getCurrentPitcher, getBattingTeam,
  getFieldingTeam, getInningsPitchedInGame, isGameOver, getWinner,
  type GameState, type GamePhase,
} from '../game/stateMachine';

export type UIPhase =
  | 'not_started'
  | 'awaiting_pitch'
  | 'pitch_rolled'
  | 'awaiting_swing'
  | 'swing_rolled'
  | 'showing_result'
  | 'half_inning_break'
  | 'game_over';

interface GameStore {
  // Core state
  gameState: GameState | null;
  uiPhase: UIPhase;

  // Current at-bat state
  pitchResult: PitchResult | null;
  swingResult: SwingResult | null;
  lastResult: AtBatResult | null;
  lastRunsScored: number;
  lastDescription: string;

  // Actions
  startNewGame: (
    awayName: string, awayLineup: PlayerCard[], awayPitching: PlayerCard[],
    homeName: string, homeLineup: PlayerCard[], homePitching: PlayerCard[],
  ) => void;
  rollPitch: () => number;
  rollSwing: () => number;
  confirmResult: () => void;
  continueToNextHalfInning: () => void;
  doChangePitcher: (newPitcher: PlayerCard) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  uiPhase: 'not_started',
  pitchResult: null,
  swingResult: null,
  lastResult: null,
  lastRunsScored: 0,
  lastDescription: '',

  startNewGame: (awayName, awayLineup, awayPitching, homeName, homeLineup, homePitching) => {
    let state = createGameState(awayName, awayLineup, awayPitching, homeName, homeLineup, homePitching);
    state = startGame(state);
    set({
      gameState: state,
      uiPhase: 'awaiting_pitch',
      pitchResult: null,
      swingResult: null,
      lastResult: null,
      lastRunsScored: 0,
      lastDescription: '',
    });
  },

  rollPitch: () => {
    const { gameState } = get();
    if (!gameState) return 0;

    const dieRoll = rollD20();
    const pitcher = getCurrentPitcher(gameState);
    const batter = getCurrentBatter(gameState);
    const inningsPitched = getInningsPitchedInGame(gameState, pitcher.id);

    const pitch = resolvePitch(pitcher, batter, dieRoll, inningsPitched);
    set({ pitchResult: pitch, uiPhase: 'pitch_rolled' });

    // Short delay then move to swing phase
    setTimeout(() => {
      set({ uiPhase: 'awaiting_swing' });
    }, 1200);

    return dieRoll;
  },

  rollSwing: () => {
    const { gameState, pitchResult } = get();
    if (!gameState || !pitchResult) return 0;

    const dieRoll = rollD20();
    const pitcher = getCurrentPitcher(gameState);
    const batter = getCurrentBatter(gameState);

    const swing = resolveSwing(pitcher, batter, pitchResult.advantage, dieRoll);
    set({ swingResult: swing, uiPhase: 'swing_rolled' });

    // Apply the result after a short delay
    setTimeout(() => {
      const { gameState: currentState } = get();
      if (!currentState) return;

      const currentBatter = getCurrentBatter(currentState);
      const currentPitcher = getCurrentPitcher(currentState);
      const baseResult = advanceRunners(
        currentState.bases,
        currentBatter.id,
        swing.result,
        currentState.outs,
      );

      const isHit = ['1B', '2B', '3B', 'HR'].includes(swing.result);
      const isAutoDP = baseResult.outs === 2; // GB with runner on 1st = auto double play
      const resultDesc = swing.result === 'HR' ? `${currentBatter.name} hits a HOME RUN!`
        : swing.result === '3B' ? `${currentBatter.name} triples!`
        : swing.result === '2B' ? `${currentBatter.name} doubles!`
        : swing.result === '1B' ? `${currentBatter.name} singles!`
        : swing.result === 'BB' ? `${currentBatter.name} draws a walk`
        : swing.result === 'SO' ? `${currentBatter.name} strikes out!`
        : isAutoDP ? `${currentBatter.name} grounds into a double play!`
        : (swing.result === 'GB' || swing.result === 'DP') ? `${currentBatter.name} grounds out`
        : `${currentBatter.name} flies out`;

      const newState = recordAtBatResult(
        currentState,
        swing.result,
        baseResult.runsScored,
        baseResult.bases,
        baseResult.outs,
        resultDesc,
      );

      const newPhase: UIPhase = isGameOver(newState)
        ? 'game_over'
        : newState.phase === 'half_inning_end'
          ? 'half_inning_break'
          : 'showing_result';

      set({
        gameState: newState,
        lastResult: swing.result,
        lastRunsScored: baseResult.runsScored.length,
        lastDescription: resultDesc,
        uiPhase: newPhase,
      });
    }, 1000);

    return dieRoll;
  },

  confirmResult: () => {
    set({
      uiPhase: 'awaiting_pitch',
      pitchResult: null,
      swingResult: null,
      lastResult: null,
      lastRunsScored: 0,
      lastDescription: '',
    });
  },

  continueToNextHalfInning: () => {
    const { gameState } = get();
    if (!gameState) return;
    const newState = startNextHalfInning(gameState);
    set({
      gameState: newState,
      uiPhase: 'awaiting_pitch',
      pitchResult: null,
      swingResult: null,
      lastResult: null,
      lastRunsScored: 0,
      lastDescription: '',
    });
  },

  doChangePitcher: (newPitcher) => {
    const { gameState } = get();
    if (!gameState) return;
    set({ gameState: changePitcher(gameState, newPitcher) });
  },

  resetGame: () => {
    set({
      gameState: null,
      uiPhase: 'not_started',
      pitchResult: null,
      swingResult: null,
      lastResult: null,
      lastRunsScored: 0,
      lastDescription: '',
    });
  },
}));
