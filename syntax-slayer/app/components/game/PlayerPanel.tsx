"use client";

import { useEffect, useRef, useState } from "react";
import type { ConsumableId, PlayerState } from "../../types/game";
import itemsData from "../../data/items.json";
import PlayerSprite from "./PlayerSprite";

type PlayerPanelProps = {
  player: PlayerState;
  critChance: number;
  effectiveAttack: number;
  attackBoostActive: boolean;
  attackSignal: number;
  hitSignal: number;
  onUseConsumable: (index: number) => void;
  consumableLabels: Record<ConsumableId, string>;
  disableConsumables: boolean;
  isEndless: boolean;
  endlessStats: {
    correct: number;
    wrong: number;
    maxStreak: number;
    accuracy: number;
  };
};

export default function PlayerPanel({
  player,
  critChance,
  effectiveAttack,
  attackBoostActive,
  attackSignal,
  hitSignal,
  onUseConsumable,
  consumableLabels,
  disableConsumables,
  isEndless,
  endlessStats,
}: PlayerPanelProps) {
  const [isDashing, setIsDashing] = useState(false);
  const [delayedAttackSignal, setDelayedAttackSignal] = useState(attackSignal);
  const lastAttackRef = useRef(attackSignal);
  const dashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dashDistance = 512;
  const dashDuration = 200;
  const dashApproachMs = 160;
  const dashHoldMs = 360;

  useEffect(() => {
    if (attackSignal === lastAttackRef.current) return;
    lastAttackRef.current = attackSignal;
    const approachMs = dashApproachMs;
    const holdMs = dashHoldMs;
    setIsDashing(true);
    if (dashTimerRef.current) {
      clearTimeout(dashTimerRef.current);
    }
    if (attackTimerRef.current) {
      clearTimeout(attackTimerRef.current);
    }
    attackTimerRef.current = setTimeout(() => {
      setDelayedAttackSignal(attackSignal);
      attackTimerRef.current = null;
    }, approachMs);
    dashTimerRef.current = setTimeout(() => {
      setIsDashing(false);
      dashTimerRef.current = null;
    }, approachMs + holdMs);
    return () => {
      if (dashTimerRef.current) {
        clearTimeout(dashTimerRef.current);
        dashTimerRef.current = null;
      }
      if (attackTimerRef.current) {
        clearTimeout(attackTimerRef.current);
        attackTimerRef.current = null;
      }
    };
  }, [attackSignal, dashApproachMs, dashHoldMs]);

  const itemImages = (itemsData as { id: string; image?: string }[]).reduce<
    Record<string, string>
  >((acc, item) => {
    if (item.image) acc[item.id] = item.image;
    return acc;
  }, {});

  return (
    <div className="rounded-3xl p-4 md:p-6 flex flex-col sw-panel">
      <div className="text-xs uppercase tracking-[0.35em] sw-muted">
        Player
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex flex-col gap-3 text-sm">
          {isEndless ? (
            <>
              <div>
                <div className="sw-muted">Correct</div>
                <div className="text-2xl font-semibold sw-title">
                  {endlessStats.correct}
                </div>
              </div>
              <div>
                <div className="sw-muted">Wrong</div>
                <div className="text-2xl font-semibold sw-title">
                  {endlessStats.wrong}
                </div>
              </div>
              <div>
                <div className="sw-muted">Best Streak</div>
                <div className="text-2xl font-semibold sw-title">
                  {endlessStats.maxStreak}
                </div>
              </div>
              <div>
                <div className="sw-muted">Accuracy</div>
                <div className="text-2xl font-semibold sw-title">
                  {endlessStats.accuracy}%
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="sw-muted">HP</div>
                <div className="text-2xl font-semibold sw-title">
                  {player.hp}
                </div>
              </div>
              <div>
                <div className="sw-muted">ATK</div>
                <div className="text-2xl font-semibold sw-title">
                  {effectiveAttack}
                </div>
                {attackBoostActive ? (
                  <div className="text-xs sw-accent-emerald">
                    x{player.attackBoost} boost
                  </div>
                ) : null}
              </div>
              <div>
                <div className="sw-muted">Focus</div>
                <div className="text-2xl font-semibold sw-title">
                  {player.focus}
                </div>
                <div className="text-xs sw-muted">Crit {critChance}%</div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-[0.3em] sw-muted">
            Items
          </div>
          <div className="flex flex-col gap-2">
            {player.consumables.map((item, index) => (
              <button
                key={`slot-${index}`}
                type="button"
                onClick={() => onUseConsumable(index)}
                disabled={!item || disableConsumables}
                title={item ? consumableLabels[item] : "Empty slot"}
                className={`flex h-12 w-12 items-center justify-center rounded border border-dashed text-[10px] uppercase tracking-[0.2em] transition ${
                  item
                    ? "border-[var(--sw-cyan)]/60 bg-[rgba(20,8,54,0.7)] text-[var(--sw-text)] hover:border-[var(--sw-accent)]"
                    : "border-[var(--sw-border)]/60 bg-[rgba(12,5,32,0.6)] text-[var(--sw-muted)]"
                } ${!item || disableConsumables ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {item ? (
                  <img
                    src={itemImages[item] ?? `/img/${item}.png`}
                    alt={consumableLabels[item]}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  "Empty"
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-2xl border border-dashed border-[var(--sw-border)]/60 bg-[rgba(12,5,32,0.5)] p-4 overflow-visible">
          <div className="relative h-full w-full rounded-xl bg-[rgba(16,8,40,0.7)] shadow-inner overflow-visible">
            <div
              className={`absolute inset-0 flex items-center justify-center transition-transform ease-out will-change-transform ${
                isDashing ? "z-20" : "z-0"
              }`}
              style={{
                transform: `translateX(${isDashing ? dashDistance : 0}px)`,
                transitionDuration: `${dashDuration}ms`,
              }}
            >
              <PlayerSprite
                attackSignal={delayedAttackSignal}
                hitSignal={hitSignal}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
