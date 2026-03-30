import { describe, it, expect } from 'vitest';
import { simulateGame, formatBoxScore } from '../simulation';
import { makeLineup, makePitchingStaff } from './fixtures';

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
