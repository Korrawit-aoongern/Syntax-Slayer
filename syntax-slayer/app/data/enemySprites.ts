export type EnemySpriteConfig = {
  spriteUrl: string;
  sheetWidth: number;
  sheetHeight: number;
  frameWidth: number;
  frameHeight: number;
  idleFrames: number;
  attackFrames: number;
  fps: number;
  scale: number;
};

export const ENEMY_SPRITE_CONFIG: Record<number, EnemySpriteConfig> = {
  1: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 9,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  2: {
    spriteUrl: "/img/Data_Rat.png",
    sheetWidth: 96,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 4,
    attackFrames: 6,
    fps: 8,
    scale: 6,
  },
  3: {
    spriteUrl: "/img/Cursor.png",
    sheetWidth: 176,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 4,
    attackFrames: 11,
    fps: 11,
    scale: 6,
  },
  4: {
    spriteUrl: "/img/Null_Wisp.png",
    sheetWidth: 320,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 20,
    fps: 20,
    scale: 6,
  },
  5: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  6: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  7: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  8: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  9: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
  10: {
    spriteUrl: "/img/Glitched_Slime.png",
    sheetWidth: 128,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idleFrames: 8,
    attackFrames: 7,
    fps: 10,
    scale: 6,
  },
};
