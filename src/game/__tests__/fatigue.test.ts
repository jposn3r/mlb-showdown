import { describe, it, expect } from 'vitest';
import { getFatiguePenalty, getEffectiveControl, getFatigueLevel, getFatigueColor } from '../fatigue';
import { makePitcher } from './fixtures';

describe('fatigue', () => {
  const pitcher = makePitcher({ control: 4, ip: 6 });

  describe('getFatiguePenalty', () => {
    it('returns 0 when innings pitched is under IP rating', () => {
      expect(getFatiguePenalty(pitcher, 3)).toBe(0);
    });

    it('returns 0 when innings pitched equals IP rating', () => {
      expect(getFatiguePenalty(pitcher, 6)).toBe(0);
    });

    it('returns -1 for each inning beyond IP rating', () => {
      expect(getFatiguePenalty(pitcher, 7)).toBe(-1);
      expect(getFatiguePenalty(pitcher, 8)).toBe(-2);
      expect(getFatiguePenalty(pitcher, 10)).toBe(-4);
    });

    it('defaults IP to 5 when not set', () => {
      const noIp = makePitcher({ ip: undefined });
      expect(getFatiguePenalty(noIp, 5)).toBe(0);
      expect(getFatiguePenalty(noIp, 6)).toBe(-1);
    });
  });

  describe('getEffectiveControl', () => {
    it('returns full control when not fatigued', () => {
      expect(getEffectiveControl(pitcher, 3)).toBe(4);
    });

    it('reduces control when fatigued', () => {
      expect(getEffectiveControl(pitcher, 7)).toBe(3); // 4 + (-1)
      expect(getEffectiveControl(pitcher, 9)).toBe(1); // 4 + (-3)
    });

    it('can go negative', () => {
      expect(getEffectiveControl(pitcher, 12)).toBe(-2); // 4 + (-6)
    });
  });

  describe('getFatigueLevel', () => {
    it('returns 0 for fresh pitcher', () => {
      expect(getFatigueLevel(pitcher, 0)).toBe(0);
    });

    it('returns fraction of IP used', () => {
      expect(getFatigueLevel(pitcher, 3)).toBe(0.5);
      expect(getFatigueLevel(pitcher, 6)).toBe(1.0);
    });

    it('returns > 1 when beyond IP', () => {
      expect(getFatigueLevel(pitcher, 9)).toBe(1.5);
    });

    it('returns 1 when IP is 0', () => {
      const zeroPitcher = makePitcher({ ip: 0 });
      expect(getFatigueLevel(zeroPitcher, 0)).toBe(1);
    });
  });

  describe('getFatigueColor', () => {
    it('returns green for low fatigue', () => {
      expect(getFatigueColor(0)).toBe('green');
      expect(getFatigueColor(0.5)).toBe('green');
      expect(getFatigueColor(0.7)).toBe('green');
    });

    it('returns yellow for moderate fatigue', () => {
      expect(getFatigueColor(0.71)).toBe('yellow');
      expect(getFatigueColor(0.9)).toBe('yellow');
      expect(getFatigueColor(1.0)).toBe('yellow');
    });

    it('returns red for high fatigue', () => {
      expect(getFatigueColor(1.01)).toBe('red');
      expect(getFatigueColor(1.5)).toBe('red');
    });
  });
});
