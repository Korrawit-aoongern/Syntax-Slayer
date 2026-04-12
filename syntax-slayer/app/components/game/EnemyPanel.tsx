"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isDashing, setIsDashing] = useState(false);
  const [delayedAttackSignal, setDelayedAttackSignal] = useState(attackSignal);
  const lastAttackRef = useRef(attackSignal);
  const dashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyName = ENEMY_SPRITE_CONFIG[level]?.name ?? "Enemy";
  const dashConfig = ENEMY_SPRITE_CONFIG[level]?.dash;
  const dashDistance = dashConfig?.distance ?? 128;
  const dashDuration = dashConfig?.durationMs ?? 200;
  const dashApproachMs = dashConfig?.approachMs ?? 160;
  const dashHoldMs = dashConfig?.holdMs ?? 260;

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

  return (
    <div className="rounded-3xl p-4 text-right md:p-6 flex flex-col sw-panel">
      <div className="text-xs uppercase tracking-[0.35em] sw-muted">
        {enemyName}
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex-1 rounded-2xl border border-dashed border-[var(--sw-border)]/60 bg-[rgba(12,5,32,0.5)] p-4 overflow-visible">
          <div className="relative h-full w-full rounded-xl bg-[rgba(16,8,40,0.7)] shadow-inner overflow-visible">
            <div
              className={`absolute inset-0 flex items-center justify-center transition-transform ease-out will-change-transform ${
                isDashing ? "z-20" : "z-0"
              }`}
              style={{
                transform: `translateX(${isDashing ? -dashDistance : 0}px)`,
                transitionDuration: `${dashDuration}ms`,
              }}
            >
              <EnemySprite
                level={level}
                attackSignal={delayedAttackSignal}
                hitSignal={hitSignal}
              />
            </div>
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
