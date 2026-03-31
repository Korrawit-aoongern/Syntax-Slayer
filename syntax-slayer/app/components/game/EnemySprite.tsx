"use client";

import { useRef } from "react";
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
  const lastSignalRef = useRef(attackSignal);
  const variantRef = useRef(0);
  const attackCount = Math.max(1, config.attacks.length);

  if (lastSignalRef.current !== attackSignal) {
    lastSignalRef.current = attackSignal;
    variantRef.current =
      attackCount === 1 ? 0 : Math.floor(Math.random() * attackCount);
  }

  return (
    <SpriteAnimator
      {...config}
      attackSignal={attackSignal}
      hitSignal={hitSignal}
      attackVariant={variantRef.current}
      ariaLabelIdle="Enemy idle animation"
      ariaLabelAttack="Enemy attack animation"
    />
  );
}
