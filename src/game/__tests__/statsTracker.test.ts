import { describe, it, expect } from 'vitest';
import { extractStatsFromGame, mergeGameStats } from '../statsTracker';
import type { GameState, GameLogEntry } from '../stateMachine';
import { createEmptySeasonStats } from '../../types/franchise';
import { makeStartedGame } from './fixtures';

function makeGameLog(entries: Partial<GameLogEntry>[]): GameLogEntry[] {
  return entries.map((e, i) => ({
    inning: 1,
    halfInning: 'top',
    batterId: 'b1',
    batterName: 'Batter 1',
    pitcherId: 'p1',
    pitcherName: 'Pitcher 1',
    result: 'SO',
    description: 'test',
    runsScored: 0,
    timestamp: i,
    ...e,
  }));
}

function makeGameStateWithLog(log: GameLogEntry[]): GameState {
  const state = makeStartedGame();
  return { ...state, gameLog: log };
}

describe('statsTracker', () => {
  describe('extractStatsFromGame', () => {
    it('counts plate appearances', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', result: 'SO' },
        { batterId: 'b1', batterName: 'B1', result: '1B' },
        { batterId: 'b2', batterName: 'B2', result: 'HR' },
      ]);
      const state = makeGameStateWithLog(log);
      const stats = extractStatsFromGame(state, 'AWAY', 'HOME');
      const b1 = stats.find(s => s.playerId === 'b1')!;
      const b2 = stats.find(s => s.playerId === 'b2')!;
      expect(b1.pa).toBe(2);
      expect(b2.pa).toBe(1);
    });

    it('counts hits correctly', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', result: '1B' },
        { batterId: 'b1', batterName: 'B1', result: '2B' },
        { batterId: 'b1', batterName: 'B1', result: 'HR' },
        { batterId: 'b1', batterName: 'B1', result: 'SO' },
      ]);
      const stats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');
      const b1 = stats.find(s => s.playerId === 'b1')!;
      expect(b1.hits).toBe(3);
      expect(b1.singles).toBe(1);
      expect(b1.doubles).toBe(1);
      expect(b1.hr).toBe(1);
      expect(b1.ab).toBe(4); // all non-BB count as AB
    });

    it('walks count as PA but not AB', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', result: 'BB' },
      ]);
      const stats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');
      const b1 = stats.find(s => s.playerId === 'b1')!;
      expect(b1.pa).toBe(1);
      expect(b1.ab).toBe(0);
      expect(b1.bb).toBe(1);
    });

    it('tracks RBI', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', result: 'HR', runsScored: 3 },
      ]);
      const stats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');
      const b1 = stats.find(s => s.playerId === 'b1')!;
      expect(b1.rbi).toBe(3);
    });

    it('tracks pitcher stats', () => {
      const log = makeGameLog([
        { pitcherId: 'p1', pitcherName: 'P1', result: 'SO', halfInning: 'top', inning: 1 },
        { pitcherId: 'p1', pitcherName: 'P1', result: '1B', halfInning: 'top', inning: 1 },
        { pitcherId: 'p1', pitcherName: 'P1', result: 'HR', halfInning: 'top', inning: 1, runsScored: 2 },
        { pitcherId: 'p1', pitcherName: 'P1', result: 'BB', halfInning: 'top', inning: 2 },
      ]);
      const stats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');
      const p1 = stats.find(s => s.playerId === 'p1')!;
      expect(p1.isPitcher).toBe(true);
      expect(p1.soRecorded).toBe(1);
      expect(p1.hitsAllowed).toBe(2); // 1B + HR
      expect(p1.hrAllowed).toBe(1);
      expect(p1.bbAllowed).toBe(1);
      expect(p1.runsAllowed).toBe(2);
      expect(p1.inningsPitched).toBe(2); // 2 distinct half-innings
    });

    it('assigns correct team to batters by half-inning', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', result: 'SO', halfInning: 'top' },
        { batterId: 'b2', batterName: 'B2', result: 'SO', halfInning: 'bottom' },
      ]);
      const stats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');
      const b1 = stats.find(s => s.playerId === 'b1')!;
      const b2 = stats.find(s => s.playerId === 'b2')!;
      expect(b1.teamAbbr).toBe('AWAY');
      expect(b2.teamAbbr).toBe('HOME');
    });
  });

  describe('mergeGameStats', () => {
    it('creates new entries for players not in season stats', () => {
      const gameStats = extractStatsFromGame(
        makeGameStateWithLog(makeGameLog([
          { batterId: 'b1', batterName: 'B1', result: '1B' },
        ])),
        'AWAY', 'HOME',
      );
      const merged = mergeGameStats({}, gameStats, 'AWAY', 'HOME', 'p1', 'p2', 'AWAY', 'HOME');
      expect(merged['b1']).toBeDefined();
      expect(merged['b1'].hits).toBe(1);
    });

    it('accumulates stats across multiple merges', () => {
      const log1 = makeGameLog([{ batterId: 'b1', batterName: 'B1', result: '1B' }]);
      const log2 = makeGameLog([{ batterId: 'b1', batterName: 'B1', result: '2B' }]);
      const stats1 = extractStatsFromGame(makeGameStateWithLog(log1), 'AWAY', 'HOME');
      const stats2 = extractStatsFromGame(makeGameStateWithLog(log2), 'AWAY', 'HOME');

      let season = mergeGameStats({}, stats1, 'AWAY', 'HOME', 'p1', 'p2', 'AWAY', 'HOME');
      season = mergeGameStats(season, stats2, 'AWAY', 'HOME', 'p1', 'p2', 'AWAY', 'HOME');

      expect(season['b1'].hits).toBe(2);
      expect(season['b1'].singles).toBe(1);
      expect(season['b1'].doubles).toBe(1);
    });

    it('assigns W to winning starter and L to losing starter', () => {
      const log = makeGameLog([
        { batterId: 'b1', batterName: 'B1', pitcherId: 'p1', pitcherName: 'P1', result: 'SO', halfInning: 'top' },
        { batterId: 'b2', batterName: 'B2', pitcherId: 'p2', pitcherName: 'P2', result: 'HR', halfInning: 'bottom', runsScored: 1 },
      ]);
      const gameStats = extractStatsFromGame(makeGameStateWithLog(log), 'AWAY', 'HOME');

      // HOME wins
      const merged = mergeGameStats({}, gameStats, 'HOME', 'AWAY', 'p1', 'p2', 'AWAY', 'HOME');
      expect(merged['p2'].wins).toBe(1);
      expect(merged['p2'].gamesStarted).toBe(1);
      expect(merged['p1'].losses).toBe(1);
      expect(merged['p1'].gamesStarted).toBe(1);
    });
  });
});
