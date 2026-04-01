"use client";

import type { SpriteConfig } from "../../types/sprite";
import SpriteAnimator from "./SpriteAnimator";

type PlayerSpriteProps = {
  attackSignal: number;
  hitSignal: number;
};

export default function PlayerSprite({ attackSignal, hitSignal }: PlayerSpriteProps) {
  const config: SpriteConfig = {
    spriteUrl: "/img/Slayer.png",
    sheetWidth: 80,
    sheetHeight: 32,
    frameWidth: 16,
    frameHeight: 16,
    idle: { row: 0, frames: 4 },
    attacks: [{ row: 1, frames: 5 }],
    fps: 10,
    scale: 6,
  };

  return (
    <SpriteAnimator
      {...config}
      attackSignal={attackSignal}
      hitSignal={hitSignal}
      ariaLabelIdle="Player idle animation"
      ariaLabelAttack="Player attack animation"
    />
  );
}
