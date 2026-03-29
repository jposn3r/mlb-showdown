/**
 * d20 dice roll module.
 * Supports seedable RNG for replay/testing.
 */

/** Simple seedable PRNG (mulberry32) */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DiceRng {
  roll(): number; // returns 1-20
}

/** Create a seeded RNG for reproducible games */
export function createSeededRng(seed: number): DiceRng {
  const rng = mulberry32(seed);
  return {
    roll: () => Math.floor(rng() * 20) + 1,
  };
}

/** Create a random RNG using Math.random */
export function createRandomRng(): DiceRng {
  return {
    roll: () => Math.floor(Math.random() * 20) + 1,
  };
}

/** Single d20 roll (convenience) */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}
