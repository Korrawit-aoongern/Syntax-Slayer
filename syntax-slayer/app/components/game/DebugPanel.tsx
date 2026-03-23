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
  consumablePool,
  consumableLabels,
}: DebugPanelProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full border border-slate-200 bg-white dark:bg-gray-700 dark:text-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300"
      >
        {show ? "Hide Debug" : "Show Debug"}
      </button>

      {show ? (
        <div className="fixed bottom-16 right-4 w-[320px] rounded-3xl border border-slate-200/70 bg-white/95 dark:bg-gray-700 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)]">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Debug Tools
          </div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Level
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={level}
                  onChange={(event) => onLevelChange(Number(event.target.value))}
                  className="w-20 rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1 text-sm"
                />
                <span className="text-xs text-slate-500">
                  Auto-resets enemy + deck
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Player Stats
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">HP</span>
                  <input
                    type="number"
                    value={player.hp}
                    onChange={(event) =>
                      onSetPlayerStat("hp", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">ATK</span>
                  <input
                    type="number"
                    value={player.attack}
                    onChange={(event) =>
                      onSetPlayerStat("attack", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Focus</span>
                  <input
                    type="number"
                    value={player.focus}
                    onChange={(event) =>
                      onSetPlayerStat("focus", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Consumables
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                {player.consumables.map((item, index) => (
                  <label
                    key={`debug-slot-${index}`}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-xs text-slate-500">
                      Slot {index + 1}
                    </span>
                    <select
                      value={item ?? ""}
                      onChange={(event) => {
                        const value = event.target.value as ConsumableId | "";
                        onSetConsumable(index, value === "" ? null : value);
                      }}
                      className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1 text-sm"
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
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  Clear Slots
                </button>
                <button
                  type="button"
                  onClick={onRandomSlot3}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  Random Slot 3
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Enemy Stats
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">HP</span>
                  <input
                    type="number"
                    value={enemy.hp}
                    onChange={(event) =>
                      onSetEnemyStat("hp", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">ATK</span>
                  <input
                    type="number"
                    value={enemy.attack}
                    onChange={(event) =>
                      onSetEnemyStat("attack", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">AP</span>
                  <input
                    type="number"
                    value={enemy.ap}
                    onChange={(event) =>
                      onSetEnemyStat("ap", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">AP Thresh</span>
                  <input
                    type="number"
                    value={enemy.apThreshold}
                    onChange={(event) =>
                      onSetEnemyStat("apThreshold", Number(event.target.value))
                    }
                    className="rounded-lg border border-slate-200 dark:bg-gray-700 px-2 py-1"
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
