"use client";

import SpriteAnimator from "./SpriteAnimator";

type PlayerSpriteProps = {
  attackSignal: number;
  hitSignal: number;
};

export default function PlayerSprite({ attackSignal, hitSignal }: PlayerSpriteProps) {
  return (
    <SpriteAnimator
      spriteUrl="/img/Slayer.png"
      sheetWidth={80}
      sheetHeight={32}
      frameWidth={16}
      frameHeight={16}
      idleFrames={4}
      attackFrames={5}
      fps={5}
      scale={6}
      attackSignal={attackSignal}
      hitSignal={hitSignal}
      ariaLabelIdle="Player idle animation"
      ariaLabelAttack="Player attack animation"
    />
  );
}
