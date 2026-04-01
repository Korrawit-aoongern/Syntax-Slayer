"use client";

import type { ConsumableId, EnemyState, PlayerState } from "../../types/game";

type DebugPanelProps = {
  show: boolean;
  onToggle: () => void;
  level: number;
  onLevelChange: (value: number) => void;
  player: PlayerState;
  enemy: EnemyState;
  onSetPlayerStat: (key: "hp" | "attack" | "focus", value: number) => void;
  onSetEnemyStat: (
    key: "hp" | "attack" | "ap" | "apThreshold",
    value: number,
  ) => void;
  onSetConsumable: (index: number, value: ConsumableId | null) => void;
  onClearConsumables: () => void;
  onRandomSlot3: () => void;
  onUnlockAllTerms: () => void;
  onResetTerms: () => void;
  consumablePool: ConsumableId[];
  consumableLabels: Record<ConsumableId, string>;
};

export default function DebugPanel({
  show,
  onToggle,
  level,
  onLevelChange,
  player,
  enemy,
  onSetPlayerStat,
  onSetEnemyStat,
  onSetConsumable,
  onClearConsumables,
  onRandomSlot3,
  onUnlockAllTerms,
  onResetTerms,
  consumablePool,
  consumableLabels,
}: DebugPanelProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full px-4 py-1.5 text-xs font-semibold sw-button-secondary"
      >
        {show ? "Hide Debug" : "Show Debug"}
      </button>

      {show ? (
        <div className="fixed bottom-16 right-4 w-[320px] rounded-3xl p-4 sw-panel">
          <div className="text-xs uppercase tracking-[0.3em] sw-muted">
            Debug Tools
          </div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl p-4 sw-surface">
              <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                Level
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={level}
                  onChange={(event) => onLevelChange(Number(event.target.value))}
                  className="w-20 rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-sm text-[var(--sw-text)]"
                />
                <span className="text-xs sw-muted">
                  Auto-resets enemy + deck
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-4 sw-surface">
              <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                Player Stats
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">HP</span>
                  <input
                    type="number"
                    value={player.hp}
                    onChange={(event) =>
                      onSetPlayerStat("hp", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">ATK</span>
                  <input
                    type="number"
                    value={player.attack}
                    onChange={(event) =>
                      onSetPlayerStat("attack", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">Focus</span>
                  <input
                    type="number"
                    value={player.focus}
                    onChange={(event) =>
                      onSetPlayerStat("focus", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl p-4 sw-surface">
              <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                Consumables
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                {player.consumables.map((item, index) => (
                  <label
                    key={`debug-slot-${index}`}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-xs sw-muted">
                      Slot {index + 1}
                    </span>
                    <select
                      value={item ?? ""}
                      onChange={(event) => {
                        const value = event.target.value as ConsumableId | "";
                        onSetConsumable(index, value === "" ? null : value);
                      }}
                      className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-sm text-[var(--sw-text)]"
                    >
                      <option value="">Empty</option>
                      {consumablePool.map((consumable) => (
                        <option key={consumable} value={consumable}>
                          {consumableLabels[consumable]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onClearConsumables}
                  className="rounded-full px-3 py-1 text-xs font-semibold sw-button-secondary"
                >
                  Clear Slots
                </button>
                <button
                  type="button"
                  onClick={onRandomSlot3}
                  className="rounded-full px-3 py-1 text-xs font-semibold sw-button-secondary"
                >
                  Random Slot 3
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4 sw-surface">
              <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                Encyclopedia
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onUnlockAllTerms}
                  className="rounded-full border border-[var(--sw-success)]/50 bg-[rgba(54,245,194,0.1)] px-3 py-1 text-xs font-semibold text-[var(--sw-success)]"
                >
                  Unlock All Terms
                </button>
                <button
                  type="button"
                  onClick={onResetTerms}
                  className="rounded-full border border-[var(--sw-danger)]/50 bg-[rgba(255,107,136,0.15)] px-3 py-1 text-xs font-semibold text-[var(--sw-danger)]"
                >
                  Reset Terms
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4 sw-surface">
              <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                Enemy Stats
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">HP</span>
                  <input
                    type="number"
                    value={enemy.hp}
                    onChange={(event) =>
                      onSetEnemyStat("hp", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">ATK</span>
                  <input
                    type="number"
                    value={enemy.attack}
                    onChange={(event) =>
                      onSetEnemyStat("attack", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">AP</span>
                  <input
                    type="number"
                    value={enemy.ap}
                    onChange={(event) =>
                      onSetEnemyStat("ap", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs sw-muted">AP Thresh</span>
                  <input
                    type="number"
                    value={enemy.apThreshold}
                    onChange={(event) =>
                      onSetEnemyStat("apThreshold", Number(event.target.value))
                    }
                    className="rounded-lg border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-2 py-1 text-[var(--sw-text)]"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
