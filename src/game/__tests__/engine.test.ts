import { describe, it, expect } from 'vitest';
import { resolvePitch, resolveSwing, resolveAtBat, isHit, isOut, getResultDescription } from '../engine';
import { makePitcher, makeBatter } from './fixtures';
import type { AtBatResult } from '../../types';

describe('engine', () => {
  const pitcher = makePitcher({ control: 4, ip: 6 });
  const batter = makeBatter({ onBase: 10 });

  describe('resolvePitch', () => {
    it('calculates pitch total as roll + control', () => {
      const result = resolvePitch(pitcher, batter, 8, 3);
      expect(result.pitchTotal).toBe(12); // 8 + 4
      expect(result.control).toBe(4);
      expect(result.fatiguePenalty).toBe(0);
    });

    it('gives pitcher advantage when pitchTotal >= onBase', () => {
      // Roll 6 + control 4 = 10, onBase = 10 → pitcher (ties go to pitcher)
      const result = resolvePitch(pitcher, batter, 6, 3);
      expect(result.advantage).toBe('pitcher');
    });

    it('gives batter advantage when pitchTotal < onBase', () => {
      // Roll 3 + control 4 = 7, onBase = 10 → batter
      const result = resolvePitch(pitcher, batter, 3, 3);
      expect(result.advantage).toBe('batter');
    });

    it('applies fatigue penalty when beyond IP', () => {
      // 7 innings pitched, IP=6 → penalty = -1
      const result = resolvePitch(pitcher, batter, 8, 7);
      expect(result.fatiguePenalty).toBe(-1);
      expect(result.pitchTotal).toBe(11); // 8 + 4 + (-1)
    });

    it('heavy fatigue can flip advantage', () => {
      // 10 innings pitched, IP=6 → penalty = -4, effective control = 0
      // Roll 5 + 0 = 5 < onBase 10 → batter advantage
      const result = resolvePitch(pitcher, batter, 5, 10);
      expect(result.advantage).toBe('batter');
    });
  });

  describe('resolveSwing', () => {
    it('uses pitcher chart when pitcher has advantage', () => {
      const result = resolveSwing(pitcher, batter, 'pitcher', 20);
      expect(result.result).toBe(pitcher.pitcherChart![20]);
    });

    it('uses batter chart when batter has advantage', () => {
      const result = resolveSwing(pitcher, batter, 'batter', 1);
      expect(result.result).toBe(batter.batterChart![1]);
    });

    it('defaults to GB for missing chart entry', () => {
      const sparseChartPitcher = makePitcher({ pitcherChart: {} });
      const result = resolveSwing(sparseChartPitcher, batter, 'pitcher', 5);
      expect(result.result).toBe('GB');
    });
  });

  describe('resolveAtBat', () => {
    it('combines pitch, swing, and baserunning', () => {
      const outcome = resolveAtBat(pitcher, batter, 6, 1, 3, [null, null, null], 0);
      expect(outcome.pitch).toBeDefined();
      expect(outcome.swing).toBeDefined();
      expect(outcome.baserunning).toBeDefined();
    });

    it('HR with bases loaded scores 4 runs', () => {
      // Force batter advantage with low roll, then roll 1 on batter chart (HR)
      const weakPitcher = makePitcher({ control: 0, ip: 0 });
      const strongBatter = makeBatter({ onBase: 16, batterChart: { 1: 'HR' } });
      const outcome = resolveAtBat(weakPitcher, strongBatter, 1, 1, 5, ['r1', 'r2', 'r3'], 0);
      if (outcome.pitch.advantage === 'batter') {
        expect(outcome.baserunning.runsScored.length).toBe(4);
      }
    });
  });

  describe('isHit', () => {
    it.each<[AtBatResult, boolean]>([
      ['1B', true], ['2B', true], ['3B', true], ['HR', true],
      ['SO', false], ['GB', false], ['FB', false], ['DP', false], ['BB', false],
    ])('%s → %s', (result, expected) => {
      expect(isHit(result)).toBe(expected);
    });
  });

  describe('isOut', () => {
    it.each<[AtBatResult, boolean]>([
      ['SO', true], ['GB', true], ['FB', true], ['DP', true],
      ['1B', false], ['2B', false], ['3B', false], ['HR', false], ['BB', false],
    ])('%s → %s', (result, expected) => {
      expect(isOut(result)).toBe(expected);
    });
  });

  describe('getResultDescription', () => {
    it('maps results to descriptions', () => {
      expect(getResultDescription('SO')).toBe('Strikeout');
      expect(getResultDescription('HR')).toBe('Home Run');
      expect(getResultDescription('BB')).toBe('Walk');
      expect(getResultDescription('1B')).toBe('Single');
      expect(getResultDescription('DP')).toBe('Double Play');
    });
  });
});
