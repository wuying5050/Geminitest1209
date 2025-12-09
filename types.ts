export enum Suit {
  Man = 'm', // Characters (Wan)
  Pin = 'p', // Dots (Bing)
  Sou = 's', // Bamboo (Tiao)
  Honor = 'z', // Winds/Dragons
}

export interface TileData {
  id: string; // Unique ID for React keys
  suit: Suit;
  value: number; // 1-9 for suits, 1-4 for Winds (ESWN), 5-7 for Dragons (WGR)
  symbol: string; // The unicode character
}

export enum Wind {
  East = 'East',
  South = 'South',
  West = 'West',
  North = 'North',
}

export enum MeldType {
  Chow = 'Chow', // Sequence (Chi)
  Pung = 'Pung', // Triplet (Pon)
  Kong = 'Kong', // Quadruplet (Kan)
  Pair = 'Pair', // Eye (Jiang)
}

export interface Meld {
  id: string;
  type: MeldType;
  tiles: TileData[]; // Usually 3 or 4 tiles
  isConcealed: boolean; // Dark (An) or Exposed (Ming)
}

export interface GameContext {
  prevalentWind: Wind;
  seatWind: Wind;
  isSelfDrawn: boolean; // Zimo
  isLastTile: boolean; // Last tile in wall
  isRobbingKong: boolean;
  isKongBloom: boolean; // Win on Kong replacement
}

export interface ScoringItem {
  name: string;
  fan: number;
  description?: string;
}

export interface ScoreResult {
  totalFan: number;
  breakdown: ScoringItem[];
  reasoning: string;
}

export interface StrategyAdvice {
  recommendedDiscard: string; // e.g., "3 Bamboo"
  targetFanPatterns: string[]; // e.g., ["Pure Straight", "Mixed Triple Chow"]
  advice: string; // General advice
  keepTiles: string[]; // Tiles to definitely keep
}

export type Language = 'zh' | 'en';