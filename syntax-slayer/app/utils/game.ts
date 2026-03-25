import type { GameCard, PlayerState, VocabItem } from "../types/game";
import { CONSUMABLE_POOL } from "../data/consumables";
import { LEVEL_CONFIG } from "../data/gameConfig";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const buildDeck = (items: VocabItem[], pairs: number): GameCard[] => {
  const picked = shuffle(items).slice(0, pairs);
  return shuffle(
    picked.flatMap((item) => [
      {
        id: `${item.id}-term`,
        pairId: item.id,
        face: "term" as const,
        text: item.term,
        category: item.category,
        isFlipped: false,
        isMatched: false,
      },
      {
        id: `${item.id}-meaning`,
        pairId: item.id,
        face: "meaning" as const,
        text: item.meaning,
        category: item.category,
        isFlipped: false,
        isMatched: false,
      },
    ]),
  );
};

export const getLevelConfig = (level: number) =>
  LEVEL_CONFIG.find((entry) => level <= entry.maxLevel) ?? LEVEL_CONFIG[0];

export const createDefaultPlayer = (): PlayerState => ({
  hp: 20,
  attack: 2,
  focus: 0,
  consumables: [null, null, null],
  shield: 0,
  attackBoost: 0,
  attackBoostUntil: 0,
});

export const withPlayerDefaults = (
  value?: Partial<PlayerState>,
): PlayerState => {
  const base = createDefaultPlayer();
  if (!value) return base;
  return {
    ...base,
    ...value,
    consumables: Array.isArray(value.consumables)
      ? (value.consumables as PlayerState["consumables"])
      : base.consumables,
  };
};

export const pickRandomConsumable = () =>
  CONSUMABLE_POOL[Math.floor(Math.random() * CONSUMABLE_POOL.length)];
