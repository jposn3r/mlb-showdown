import { describe, it, expect } from 'vitest';
import { simulateGame, simulateFromState, formatBoxScore } from '../simulation';
import { makeLineup, makePitchingStaff, makeStartedGame } from './fixtures';
import { recordAtBatResult, startNextHalfInning } from '../stateMachine';

describe('simulation', () => {
  const awayLineup = makeLineup('away');
  const awayPitching = makePitchingStaff('away');
  const homeLineup = makeLineup('home');
  const homePitching = makePitchingStaff('home');

  describe('simulateGame', () => {
    it('completes a game with a winner', () => {
      const result = simulateGame(
        'Away', awayLineup, awayPitching,
        'Home', homeLineup, homePitching,
        42,
      );
      expect(result.winner).not.toBeNull();
      expect(result.finalState.phase).toBe('game_over');
      expect(result.innings).toBeGreaterThanOrEqual(9);
    });

    it('is deterministic with the same seed', () => {
      const r1 = simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, 123);
      const r2 = simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, 123);
      expect(r1.awayScore).toBe(r2.awayScore);
      expect(r1.homeScore).toBe(r2.homeScore);
      expect(r1.winner).toBe(r2.winner);
      expect(r1.innings).toBe(r2.innings);
    });

    it('produces different results with different seeds', () => {
      const results = Array.from({ length: 5 }, (_, i) =>
        simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, i),
      );
      // At least some games should have different scores
      const scores = results.map(r => `${r.awayScore}-${r.homeScore}`);
      const unique = new Set(scores);
      expect(unique.size).toBeGreaterThan(1);
    });

    it('winner has the higher score', () => {
      const result = simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, 99);
      if (result.winner === 'away') {
        expect(result.awayScore).toBeGreaterThan(result.homeScore);
      } else {
        expect(result.homeScore).toBeGreaterThan(result.awayScore);
      }
    });

    it('game log has entries', () => {
      const result = simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, 42);
      expect(result.finalState.gameLog.length).toBeGreaterThan(0);
    });
  });

  describe('simulateFromState', () => {
    it('completes a game from a mid-game state', () => {
      let state = makeStartedGame();
      // Play a couple at-bats to get into a mid-game state
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, '1B', [], ['away-batter-1', null, null], 0, 'Single');
      const result = simulateFromState(state);
      expect(result.finalState.phase).toBe('game_over');
      expect(result.winner).not.toBeNull();
      expect(result.innings).toBeGreaterThanOrEqual(9);
    });

    it('handles state already at game_over', () => {
      const completed = simulateGame('A', awayLineup, awayPitching, 'H', homeLineup, homePitching, 42);
      const result = simulateFromState(completed.finalState);
      expect(result.finalState.phase).toBe('game_over');
      expect(result.awayScore).toBe(completed.awayScore);
      expect(result.homeScore).toBe(completed.homeScore);
    });

    it('handles state at half_inning_end phase', () => {
      let state = makeStartedGame();
      // Force 3 outs to reach half_inning_end
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      expect(state.phase).toBe('half_inning_end');
      const result = simulateFromState(state);
      expect(result.finalState.phase).toBe('game_over');
      expect(result.winner).not.toBeNull();
    });

    it('coerces mid-at-bat phase to pre_at_bat', () => {
      let state = makeStartedGame();
      // Force an unusual phase that could occur if user quits mid-at-bat
      state = { ...state, phase: 'pitch' };
      const result = simulateFromState(state);
      expect(result.finalState.phase).toBe('game_over');
      expect(result.winner).not.toBeNull();
    });
  });

  describe('formatBoxScore', () => {
    it('produces a multi-line string with team names', () => {
      const result = simulateGame('Away', awayLineup, awayPitching, 'Home', homeLineup, homePitching, 42);
      const box = formatBoxScore(result.finalState);
      const lines = box.split('\n');
      expect(lines).toHaveLength(3); // header + away + home
      expect(lines[1]).toContain('Away');
      expect(lines[2]).toContain('Home');
    });

    it('includes R H E columns', () => {
      const result = simulateGame('Away', awayLineup, awayPitching, 'Home', homeLineup, homePitching, 42);
      const box = formatBoxScore(result.finalState);
      expect(box).toContain('R');
      expect(box).toContain('H');
      expect(box).toContain('E');
    });
  });
});
