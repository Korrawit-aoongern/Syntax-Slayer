"use client";

import type { ConsumableId } from "../../types/game";
import itemsData from "../../data/items.json";

type VictoryScreenProps = {
  level: number;
  autoHpGain: number;
  upgradeOptions: string[];
  selectedUpgrade: number | null;
  onSelectUpgrade: (index: number) => void;
  onNextLevel: () => void;
  nextDisabled: boolean;
  lootBlocked: boolean;
  pendingLootLabel: string | null;
  pendingLootId: ConsumableId | null;
  consumables: Array<ConsumableId | null>;
  consumableLabels: Record<ConsumableId, string>;
  onSelectDiscard: (index: number) => void;
  lootReplaceIndex: number | null;
};

export default function VictoryScreen({
  level,
  autoHpGain,
  upgradeOptions,
  selectedUpgrade,
  onSelectUpgrade,
  onNextLevel,
  nextDisabled,
  lootBlocked,
  pendingLootLabel,
  pendingLootId,
  consumables,
  consumableLabels,
  onSelectDiscard,
  lootReplaceIndex,
}: VictoryScreenProps) {
  const items = itemsData as {
    id: string;
    name: string;
    image?: string;
  }[];
  const lootItem = pendingLootId
    ? items.find((item) => item.id === pendingLootId) ?? null
    : null;
  const lootImage = lootItem?.image ?? (pendingLootId ? `/img/${pendingLootId}.png` : null);
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="rounded-3xl p-6 sw-panel">
          <div className="text-xs uppercase tracking-[0.3em] sw-accent-amber">
            Victory
          </div>
          <h1 className="mt-2 text-3xl font-semibold sw-title">
            Level {level} Cleared
          </h1>
          <p className="mt-2 text-sm sw-muted">
            Choose one of the three upgrade cards below.
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--sw-success)]">
            You leveled up! You gain {autoHpGain} HP.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {upgradeOptions.map((label, index) => {
            const isSelected = selectedUpgrade === index;
            const artImage =
              index === 0
                ? "/img/HPUP.png"
                : index === 1
                  ? "/img/ATKUP.png"
                  : lootImage;
            const showArtImage = !!artImage;
            return (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onSelectUpgrade(index)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? "border-[var(--sw-accent)] bg-[rgba(16,8,40,0.8)] shadow-[0_12px_28px_-18px_rgba(255,43,214,0.6)]"
                    : "border-[var(--sw-border)] bg-[rgba(12,5,32,0.7)] hover:border-[var(--sw-cyan)]"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                  Upgrade Card
                </div>
                <div className="mt-2 text-sm font-semibold sw-title">
                  {label}
                </div>
                <div className="mt-3 h-24 rounded-xl bg-[rgba(12,5,32,0.5)] flex items-center justify-center border border-[var(--sw-border-soft)]">
                  {showArtImage ? (
                    <img
                      src={artImage}
                      alt={label}
                      className="max-h-20 w-auto"
                    />
                  ) : (
                    <span className="sr-only">Upgrade artwork</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {lootBlocked ? (
          <div className="rounded-3xl p-6 sw-panel">
            <div className="text-xs uppercase tracking-[0.3em] sw-muted">
              Inventory Full - Discard One
            </div>
            <div className="mt-2 text-sm sw-muted">
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
                      ? "border-[var(--sw-accent)] bg-[rgba(255,43,214,0.12)] text-[var(--sw-accent)]"
                      : "border-[var(--sw-border)] bg-[rgba(12,5,32,0.6)] text-[var(--sw-text)] hover:border-[var(--sw-cyan)]"
                  }`}
                >
                  {item ? consumableLabels[item] : "Empty"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.25em] sw-muted">
            Next level unlocks a new enemy
          </div>
          <button
            type="button"
            onClick={onNextLevel}
            disabled={nextDisabled}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
              nextDisabled
                ? "cursor-not-allowed bg-[rgba(22,8,50,0.6)] text-[var(--sw-muted)]"
                : "sw-button-primary"
            }`}
          >
            {level >= 10 ? "Campaign Complete" : "Next Level"}
          </button>
        </div>
      </div>
    </div>
  );
}
