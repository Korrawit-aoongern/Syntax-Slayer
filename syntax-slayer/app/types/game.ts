export type Category = "SE" | "CS" | "CPE" | "IT" | "IS";

export type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: Category;
};

export type CardFace = "term" | "meaning";

export type GameCard = {
  id: string;
  pairId: string;
  face: CardFace;
  text: string;
  category: Category;
  isFlipped: boolean;
  isMatched: boolean;
};

export type ConsumableId =
  | "minor_reveal"
  | "major_reveal"
  | "cosmic_reveal"
  | "freeze"
  | "obsidian_shield"
  | "holyxaliber"
  | "bandage"
  | "med_kit"
  | "holy_heal";

export type PlayerState = {
  hp: number;
  attack: number;
  focus: number;
  consumables: Array<ConsumableId | null>;
  shield: number;
  attackBoost: number;
  attackBoostUntil: number;
};

export type EnemyState = {
  hp: number;
  attack: number;
  ap: number;
  apThreshold: number;
};

export type GameView =
  | "mainmenu"
  | "game"
  | "victory"
  | "finalvictory"
  | "gameover"
  | "encyclopedia";

export type SessionState = {
  view: GameView;
  level: number;
  player: PlayerState;
  enemy: EnemyState;
  cards: GameCard[];
  unlockedTerms: string[];
  runUnlockedTerms?: string[];
  selectedUpgrade: number | null;
};

export type LevelConfig = {
  maxLevel: number;
  rows: number;
  cols: number;
  pairs: number;
};
