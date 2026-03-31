export type AnimationClip = {
  row: number;
  frames: number;
  fps?: number;
};

export type SpriteConfig = {
  spriteUrl: string;
  sheetWidth: number;
  sheetHeight: number;
  frameWidth: number;
  frameHeight: number;
  idle: AnimationClip;
  attacks: AnimationClip[];
  fps?: number;
  scale?: number;
};
