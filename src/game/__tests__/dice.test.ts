import { describe, it, expect } from 'vitest';
import { createSeededRng, createRandomRng, rollD20 } from '../dice';

describe('dice', () => {
  describe('createSeededRng', () => {
    it('produces values in 1-20 range', () => {
      const rng = createSeededRng(42);
      for (let i = 0; i < 100; i++) {
        const roll = rng.roll();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    });

    it('is deterministic with the same seed', () => {
      const rng1 = createSeededRng(123);
      const rng2 = createSeededRng(123);
      const rolls1 = Array.from({ length: 20 }, () => rng1.roll());
      const rolls2 = Array.from({ length: 20 }, () => rng2.roll());
      expect(rolls1).toEqual(rolls2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createSeededRng(1);
      const rng2 = createSeededRng(2);
      const rolls1 = Array.from({ length: 10 }, () => rng1.roll());
      const rolls2 = Array.from({ length: 10 }, () => rng2.roll());
      expect(rolls1).not.toEqual(rolls2);
    });
  });

  describe('createRandomRng', () => {
    it('produces values in 1-20 range', () => {
      const rng = createRandomRng();
      for (let i = 0; i < 100; i++) {
        const roll = rng.roll();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollD20', () => {
    it('produces values in 1-20 range', () => {
      for (let i = 0; i < 100; i++) {
        const roll = rollD20();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    });

    it('returns integers', () => {
      for (let i = 0; i < 50; i++) {
        expect(Number.isInteger(rollD20())).toBe(true);
      }
    });
  });
});
