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
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-dashed border-[var(--sw-border)]/60 bg-[rgba(12,5,32,0.5)] p-3 sm:p-4 order-2 sm:order-none">
          <div className="h-full w-full rounded-xl bg-[rgba(16,8,40,0.7)] shadow-inner flex items-center justify-center">
            <div className="scale-90 sm:scale-100">
            <EnemySprite
              level={level}
              attackSignal={attackSignal}
              hitSignal={hitSignal}
            />
            </div>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-wrap flex-col justify-end gap-3 text-sm order-1 sm:order-none">
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
