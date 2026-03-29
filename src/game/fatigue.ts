/**
 * Pitcher fatigue system.
 *
 * Each pitcher has an IP rating (innings effective at full strength).
 * Beyond IP: subtract 1 from pitch roll per inning over the limit.
 */

import type { PlayerCard } from '../types';

/**
 * Calculate the fatigue penalty for a pitcher.
 * @param pitcher The pitcher card
 * @param inningsPitched Number of full innings pitched so far in this game
 * @returns Negative modifier to apply to the pitch roll (0 or less)
 */
export function getFatiguePenalty(pitcher: PlayerCard, inningsPitched: number): number {
  const ipRating = pitcher.ip ?? 5;
  if (inningsPitched <= ipRating) return 0;
  return -(inningsPitched - ipRating);
}

/**
 * Get the effective control for a pitcher accounting for fatigue.
 */
export function getEffectiveControl(pitcher: PlayerCard, inningsPitched: number): number {
  return (pitcher.control ?? 0) + getFatiguePenalty(pitcher, inningsPitched);
}

/**
 * Get fatigue level as a fraction (0 = fresh, 1 = at limit, >1 = beyond limit).
 */
export function getFatigueLevel(pitcher: PlayerCard, inningsPitched: number): number {
  const ipRating = pitcher.ip ?? 5;
  if (ipRating === 0) return 1;
  return inningsPitched / ipRating;
}

/**
 * Get fatigue color for UI display.
 */
export function getFatigueColor(fatigueLevel: number): 'green' | 'yellow' | 'red' {
  if (fatigueLevel <= 0.7) return 'green';
  if (fatigueLevel <= 1.0) return 'yellow';
  return 'red';
}
