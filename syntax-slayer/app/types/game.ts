export type Card = {
  id: string;
  term: string;
  meaning: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export type Player = {
  hp: number;
  attack: number;
  focus: number;
};

export type Enemy = {
  hp: number;
  attack: number;
  ap: number;
  apThreshold: number;
};