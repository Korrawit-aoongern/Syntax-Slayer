"use client";

import type { EnemyState } from "../../types/game";
import { ENEMY_SPRITE_CONFIG } from "../../data/enemySprites";
import EnemySprite from "./EnemySprite";

type EnemyPanelProps = {
  enemy: EnemyState;
  level: number;
  attackSignal: number;
  hitSignal: number;
};

export default function EnemyPanel({
  enemy,
  level,
  attackSignal,
  hitSignal,
}: EnemyPanelProps) {
  const enemyName = ENEMY_SPRITE_CONFIG[level]?.name ?? "Enemy";
  return (
    <div className="rounded-3xl p-4 text-right md:p-6 flex flex-col sw-panel">
      <div className="text-xs uppercase tracking-[0.35em] sw-muted">
        {enemyName}
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex-1 rounded-2xl border border-dashed border-[var(--sw-border)]/60 bg-[rgba(12,5,32,0.5)] p-4">
          <div className="h-full w-full rounded-xl bg-[rgba(16,8,40,0.7)] shadow-inner flex items-center justify-center">
            <EnemySprite
              level={level}
              attackSignal={attackSignal}
              hitSignal={hitSignal}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-sm">
          <div>
            <div className="sw-muted">HP</div>
            <div className="text-2xl font-semibold sw-title">{enemy.hp}</div>
          </div>
          <div>
            <div className="sw-muted">ATK</div>
            <div className="text-2xl font-semibold sw-title">
              {enemy.attack}
            </div>
          </div>
          <div>
            <div className="sw-muted">AP</div>
            <div className="text-2xl font-semibold sw-title">
              {enemy.ap}/{enemy.apThreshold}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
