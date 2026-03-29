/**
 * Core game engine — pitch resolution, advantage determination,
 * chart lookup, and at-bat resolution.
 *
 * Pure TypeScript, no React dependencies.
 */

import type { PlayerCard, AtBatResult, OutcomeChart } from '../types';
import { getEffectiveControl } from './fatigue';
import { advanceRunners, type Bases, type BaserunningResult } from './baserunning';

export type Advantage = 'pitcher' | 'batter';

export interface PitchResult {
  dieRoll: number;
  control: number;
  fatiguePenalty: number;
  pitchTotal: number;
  batterOnBase: number;
  advantage: Advantage;
}

export interface SwingResult {
  dieRoll: number;
  chart: OutcomeChart;
  result: AtBatResult;
}

export interface AtBatOutcome {
  pitch: PitchResult;
  swing: SwingResult;
  baserunning: BaserunningResult;
}

/**
 * Resolve the pitch phase.
 * @returns Which side has advantage and all the numbers.
 */
export function resolvePitch(
  pitcher: PlayerCard,
  batter: PlayerCard,
  pitchDieRoll: number,
  inningsPitched: number,
): PitchResult {
  const control = pitcher.control ?? 0;
  const fatiguePenalty = inningsPitched > (pitcher.ip ?? 5) ? -(inningsPitched - (pitcher.ip ?? 5)) : 0;
  const effectiveControl = control + fatiguePenalty;
  const pitchTotal = pitchDieRoll + effectiveControl;
  const batterOnBase = batter.onBase ?? 10;

  // Ties go to pitcher (official rules: pitch >= onBase = pitcher advantage)
  const advantage: Advantage = pitchTotal >= batterOnBase ? 'pitcher' : 'batter';

  return {
    dieRoll: pitchDieRoll,
    control,
    fatiguePenalty,
    pitchTotal,
    batterOnBase,
    advantage,
  };
}

/**
 * Resolve the swing phase — look up the result on the chart.
 */
export function resolveSwing(
  pitcher: PlayerCard,
  batter: PlayerCard,
  advantage: Advantage,
  swingDieRoll: number,
): SwingResult {
  const chart = advantage === 'pitcher'
    ? pitcher.pitcherChart!
    : batter.batterChart!;

  const result = chart[swingDieRoll] ?? 'GB';

  return {
    dieRoll: swingDieRoll,
    chart,
    result,
  };
}

/**
 * Resolve a complete at-bat: pitch + swing + baserunning.
 */
export function resolveAtBat(
  pitcher: PlayerCard,
  batter: PlayerCard,
  pitchDieRoll: number,
  swingDieRoll: number,
  inningsPitched: number,
  bases: Bases,
  currentOuts: number,
): AtBatOutcome {
  const pitch = resolvePitch(pitcher, batter, pitchDieRoll, inningsPitched);
  const swing = resolveSwing(pitcher, batter, pitch.advantage, swingDieRoll);
  const baserunning = advanceRunners(bases, batter.id, swing.result, currentOuts);

  return { pitch, swing, baserunning };
}

/**
 * Check if a result is a hit (batter reaches base).
 */
export function isHit(result: AtBatResult): boolean {
  return ['1B', '2B', '3B', 'HR'].includes(result);
}

/**
 * Check if a result is an out.
 */
export function isOut(result: AtBatResult): boolean {
  return ['SO', 'GB', 'FB', 'DP'].includes(result);
}

/**
 * Get a human-readable description of an at-bat result.
 */
export function getResultDescription(result: AtBatResult): string {
  const descriptions: Record<AtBatResult, string> = {
    'SO': 'Strikeout',
    'GB': 'Ground Out',
    'FB': 'Fly Out',
    'DP': 'Double Play',
    'BB': 'Walk',
    '1B': 'Single',
    '2B': 'Double',
    '3B': 'Triple',
    'HR': 'Home Run',
  };
  return descriptions[result] ?? result;
}
