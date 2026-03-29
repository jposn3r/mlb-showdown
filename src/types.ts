// Core game types

export type AtBatResult =
  | 'SO' | 'GB' | 'FB' | 'DP'
  | 'BB' | '1B' | '2B' | '3B' | 'HR';

export type OutcomeChart = Record<number, AtBatResult>; // keys 1-20

export type Position = 'SP' | 'RP' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
export type BatSide = 'R' | 'L' | 'S';
export type ThrowHand = 'R' | 'L';
export type Speed = 'A' | 'B' | 'C';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'foil';

export interface PlayerCard {
  id: string;
  name: string;
  year: number;
  team: string;
  teamColor: string;
  position: Position;
  throws: ThrowHand;
  bats: BatSide;
  points: number;
  rarity: Rarity;
  headshotUrl: string;
  mlbPlayerId: number;
  seasonsRemaining?: number;

  // Pitchers only
  control?: number;       // 0-6
  ip?: number;            // innings effective
  pitcherChart?: OutcomeChart;

  // Batters only
  onBase?: number;        // 7-16
  speed?: Speed;
  fielding?: number;      // 1-5
  arm?: number;           // 1-5
  batterChart?: OutcomeChart;
}
