"use client";

import type { EnemyState } from "../../types/game";

type EnemyPanelProps = {
  enemy: EnemyState;
};

export default function EnemyPanel({ enemy }: EnemyPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 text-right shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] md:p-6 flex flex-col">
      <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
        Enemy
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex-1 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-center text-sm text-slate-400">
          Enemy art slot
        </div>
        <div className="flex flex-col items-end gap-3 text-sm">
          <div>
            <div className="text-slate-500">HP</div>
            <div className="text-2xl font-semibold">{enemy.hp}</div>
          </div>
          <div>
            <div className="text-slate-500">ATK</div>
            <div className="text-2xl font-semibold">{enemy.attack}</div>
          </div>
          <div>
            <div className="text-slate-500">AP</div>
            <div className="text-2xl font-semibold">
              {enemy.ap}/{enemy.apThreshold}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
