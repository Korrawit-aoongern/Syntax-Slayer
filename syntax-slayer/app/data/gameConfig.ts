import type { EnemyState, LevelConfig } from "../types/game";

export const STORAGE_KEY = "syntax-slayer-session-v1";
export const ENCYCLOPEDIA_KEY = "syntax-slayer-encyclopedia-v1";

export const LEVEL_CONFIG: LevelConfig[] = [
  { maxLevel: 4, rows: 2, cols: 3, pairs: 3 },
  { maxLevel: 8, rows: 2, cols: 4, pairs: 4 },
  { maxLevel: 10, rows: 2, cols: 6, pairs: 6 },
];

export const ENEMY_STATS: Record<number, Omit<EnemyState, "ap">> = {
  1: { hp: 8, attack: 2, apThreshold: 5 },
  2: { hp: 14, attack: 2, apThreshold: 5 },
  3: { hp: 20, attack: 4, apThreshold: 4 },
  4: { hp: 28, attack: 4, apThreshold: 4 },
  5: { hp: 40, attack: 6, apThreshold: 5 },
  6: { hp: 52, attack: 6, apThreshold: 4 },
  7: { hp: 64, attack: 8, apThreshold: 4 },
  8: { hp: 80, attack: 8, apThreshold: 3 },
  9: { hp: 96, attack: 10, apThreshold: 4 },
  10: { hp: 120, attack: 10, apThreshold: 3 },
};
