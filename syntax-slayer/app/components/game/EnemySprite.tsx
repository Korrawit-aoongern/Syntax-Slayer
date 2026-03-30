"use client";

import { ENEMY_SPRITE_CONFIG } from "../../data/enemySprites";
import SpriteAnimator from "./SpriteAnimator";

type EnemySpriteProps = {
  level: number;
  attackSignal: number;
  hitSignal: number;
};

export default function EnemySprite({
  level,
  attackSignal,
  hitSignal,
}: EnemySpriteProps) {
  const config = ENEMY_SPRITE_CONFIG[level] ?? ENEMY_SPRITE_CONFIG[1];

  return (
    <SpriteAnimator
      spriteUrl={config.spriteUrl}
      sheetWidth={config.sheetWidth}
      sheetHeight={config.sheetHeight}
      frameWidth={config.frameWidth}
      frameHeight={config.frameHeight}
      idleFrames={config.idleFrames}
      attackFrames={config.attackFrames}
      fps={config.fps}
      scale={config.scale}
      attackSignal={attackSignal}
      hitSignal={hitSignal}
      ariaLabelIdle="Enemy idle animation"
      ariaLabelAttack="Enemy attack animation"
    />
  );
}
