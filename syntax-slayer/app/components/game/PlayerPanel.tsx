"use client";

import type { ConsumableId, PlayerState } from "../../types/game";

type PlayerPanelProps = {
  player: PlayerState;
  critChance: number;
  effectiveAttack: number;
  attackBoostActive: boolean;
  onUseConsumable: (index: number) => void;
  consumableLabels: Record<ConsumableId, string>;
  disableConsumables: boolean;
};

export default function PlayerPanel({
  player,
  critChance,
  effectiveAttack,
  attackBoostActive,
  onUseConsumable,
  consumableLabels,
  disableConsumables,
}: PlayerPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] md:p-6 flex flex-col">
      <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
        Player
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <div className="text-slate-500">HP</div>
            <div className="text-2xl font-semibold">{player.hp}</div>
          </div>
          <div>
            <div className="text-slate-500">ATK</div>
            <div className="text-2xl font-semibold">{effectiveAttack}</div>
            {attackBoostActive ? (
              <div className="text-xs text-emerald-500">
                +{player.attackBoost} boost
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-slate-500">Focus</div>
            <div className="text-2xl font-semibold">{player.focus}</div>
            <div className="text-xs text-slate-400">Crit {critChance}%</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Items
          </div>
          <div className="flex flex-col gap-2">
            {player.consumables.map((item, index) => (
              <button
                key={`slot-${index}`}
                type="button"
                onClick={() => onUseConsumable(index)}
                disabled={!item || disableConsumables}
                className={`flex h-10 items-center justify-center rounded-xl border border-dashed text-[10px] uppercase tracking-[0.2em] transition ${
                  item
                    ? "border-slate-200/80 bg-white text-slate-600 hover:border-amber-300"
                    : "border-slate-200/80 bg-slate-50/70 text-slate-400"
                } ${!item || disableConsumables ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {item ? consumableLabels[item] : "Empty"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-center text-sm text-slate-400">
          Player art slot
        </div>
      </div>
    </div>
  );
}
