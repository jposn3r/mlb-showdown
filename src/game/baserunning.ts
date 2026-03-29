/**
 * Baserunning logic.
 *
 * Bases are represented as [first, second, third] where each is
 * a runner ID (string) or null.
 */

import type { AtBatResult } from '../types';

export type Bases = [string | null, string | null, string | null];

export interface BaserunningResult {
  bases: Bases;
  runsScored: string[]; // runner IDs that scored
  outs: number;         // additional outs from this play (0, 1, or 2)
}

/**
 * Advance runners based on an at-bat result.
 * @param bases Current base state [1st, 2nd, 3rd]
 * @param batterId The batter's player ID
 * @param result The at-bat result
 * @param currentOuts Current outs before this play
 * @returns New base state, runs scored, and outs from this play
 */
export function advanceRunners(
  bases: Bases,
  batterId: string,
  result: AtBatResult,
  currentOuts: number,
): BaserunningResult {
  const [first, second, third] = bases;
  const scored: string[] = [];
  let newBases: Bases = [null, null, null];
  let outs = 0;

  switch (result) {
    case 'HR':
      // Everyone scores including batter
      if (third) scored.push(third);
      if (second) scored.push(second);
      if (first) scored.push(first);
      scored.push(batterId);
      break;

    case '3B':
      // All runners score, batter to 3rd
      if (third) scored.push(third);
      if (second) scored.push(second);
      if (first) scored.push(first);
      newBases[2] = batterId;
      break;

    case '2B':
      // All runners advance 2 bases
      if (third) scored.push(third);
      if (second) scored.push(second);
      if (first) scored.push(first);
      newBases[1] = batterId;
      break;

    case '1B':
      // All runners advance 1 base
      if (third) scored.push(third);
      if (second) newBases[2] = second;
      if (first) newBases[1] = first;
      newBases[0] = batterId;
      break;

    case 'BB':
      // Force advance only
      if (first && second && third) {
        // Bases loaded: runner on 3rd scores
        scored.push(third);
        newBases[2] = second;
        newBases[1] = first;
        newBases[0] = batterId;
      } else if (first && second) {
        // 1st and 2nd: force to 2nd and 3rd
        newBases[2] = second;
        newBases[1] = first;
        newBases[0] = batterId;
      } else if (first) {
        // Runner on 1st: force to 2nd
        newBases[1] = first;
        newBases[0] = batterId;
        newBases[2] = third; // 3rd stays
      } else {
        // No force
        newBases[0] = batterId;
        newBases[1] = second;
        newBases[2] = third;
      }
      break;

    case 'GB':
    case 'DP': // DP on chart treated as GB; auto-DP logic below
      // Auto double play: GB with runner on 1st and < 2 outs
      if (first && currentOuts < 2) {
        outs = 2;
        // Runner on 1st is out, batter is out
        // Runners on 2nd/3rd advance
        if (third) scored.push(third);
        if (second) newBases[2] = second;
      } else {
        // Regular ground out. Runners on 2nd/3rd advance, runner on 1st holds.
        outs = 1;
        if (third) scored.push(third);
        if (second) newBases[2] = second;
        newBases[0] = first;
      }
      break;

    case 'FB':
      // Batter out. Runners hold.
      outs = 1;
      newBases[0] = first;
      newBases[1] = second;
      newBases[2] = third;
      break;

    case 'SO':
      // Strikeout — no runner movement
      outs = 1;
      newBases[0] = first;
      newBases[1] = second;
      newBases[2] = third;
      break;
  }

  return { bases: newBases, runsScored: scored, outs };
}

/**
 * Attempt a stolen base.
 * @param bases Current base state
 * @param runnerBase Which base the runner is on (0=1st, 1=2nd)
 * @param dieRoll d20 result
 * @param speed Runner's speed rating
 * @returns Updated bases and whether successful
 */
export function attemptSteal(
  bases: Bases,
  runnerBase: 0 | 1,
  dieRoll: number,
  speed: 'A' | 'B' | 'C',
): { bases: Bases; success: boolean; runnerId: string | null } {
  const thresholds = { A: 8, B: 12, C: 16 };
  const threshold = thresholds[speed];
  const runnerId = bases[runnerBase];

  if (!runnerId) {
    return { bases: [...bases] as Bases, success: false, runnerId: null };
  }

  const targetBase = runnerBase + 1;

  // Can't steal if target base is occupied
  if (bases[targetBase]) {
    return { bases: [...bases] as Bases, success: false, runnerId };
  }

  const newBases: Bases = [...bases];
  const success = dieRoll >= threshold;

  if (success) {
    newBases[runnerBase] = null;
    newBases[targetBase as 0 | 1 | 2] = runnerId;
  } else {
    // Runner is out
    newBases[runnerBase] = null;
  }

  return { bases: newBases, success, runnerId };
}
