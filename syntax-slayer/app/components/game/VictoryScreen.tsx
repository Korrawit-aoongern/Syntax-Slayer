"use client";

import type { ConsumableId } from "../../types/game";

type VictoryScreenProps = {
  level: number;
  upgradeOptions: string[];
  selectedUpgrade: number | null;
  onSelectUpgrade: (index: number) => void;
  onNextLevel: () => void;
  nextDisabled: boolean;
  lootBlocked: boolean;
  pendingLootLabel: string | null;
  consumables: Array<ConsumableId | null>;
  consumableLabels: Record<ConsumableId, string>;
  onSelectDiscard: (index: number) => void;
  lootReplaceIndex: number | null;
};

export default function VictoryScreen({
  level,
  upgradeOptions,
  selectedUpgrade,
  onSelectUpgrade,
  onNextLevel,
  nextDisabled,
  lootBlocked,
  pendingLootLabel,
  consumables,
  consumableLabels,
  onSelectDiscard,
  lootReplaceIndex,
}: VictoryScreenProps) {
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-600">
            Victory
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Level {level} Cleared
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose one of the three upgrade cards below. (Placeholder)
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {upgradeOptions.map((label, index) => {
            const isSelected = selectedUpgrade === index;
            return (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onSelectUpgrade(index)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? "border-amber-400 bg-white shadow-[0_10px_24px_-16px_rgba(251,191,36,0.7)]"
                    : "border-slate-200/70 bg-white/80 hover:border-amber-300"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Upgrade Card
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  {label}
                </div>
                <div className="mt-3 h-24 rounded-xl border border-dashed border-slate-200/70 bg-slate-50/70 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
                  Art slot
                </div>
              </button>
            );
          })}
        </div>

        {lootBlocked ? (
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Inventory Full - Discard One
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Select a slot to replace with {pendingLootLabel ?? "loot"}.
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {consumables.map((item, index) => (
                <button
                  key={`discard-${index}`}
                  type="button"
                  onClick={() => onSelectDiscard(index)}
                  className={`rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    lootReplaceIndex === index
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200/80 bg-white text-slate-600 hover:border-amber-300"
                  }`}
                >
                  {item ? consumableLabels[item] : "Empty"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Next level unlocks a new enemy
          </div>
          <button
            type="button"
            onClick={onNextLevel}
            disabled={nextDisabled}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              nextDisabled
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {level >= 10 ? "Campaign Complete" : "Next Level"}
          </button>
        </div>
      </div>
    </div>
  );
}
