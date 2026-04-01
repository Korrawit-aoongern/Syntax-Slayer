"use client";

import { useEffect, useRef, useState } from "react";
import type { SpriteConfig } from "../../types/sprite";

type SpriteAnimatorProps = SpriteConfig & {
  attackSignal: number;
  hitSignal: number;
  attackVariant?: number;
  ariaLabelIdle: string;
  ariaLabelAttack: string;
};

export default function SpriteAnimator({
  spriteUrl,
  sheetWidth,
  sheetHeight,
  frameWidth,
  frameHeight,
  idle,
  attacks,
  fps = 5,
  scale = 6,
  attackSignal,
  hitSignal,
  attackVariant = 0,
  ariaLabelIdle,
  ariaLabelAttack,
}: SpriteAnimatorProps) {
  const [mode, setMode] = useState<"idle" | "attack">("idle");
  const [frame, setFrame] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const lastSignalRef = useRef(attackSignal);
  const lastHitRef = useRef(hitSignal);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (attackSignal === lastSignalRef.current) return;
    lastSignalRef.current = attackSignal;
    setMode("attack");
    setFrame(0);
  }, [attackSignal]);

  useEffect(() => {
    if (hitSignal === lastHitRef.current) return;
    lastHitRef.current = hitSignal;
    if (hitSignal <= 0) return;
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    setFlashOn(true);
    flashTimerRef.current = setTimeout(() => {
      setFlashOn(false);
      flashTimerRef.current = null;
    }, 220);
  }, [hitSignal]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentClip =
      mode === "idle"
        ? idle
        : attacks[Math.max(0, Math.min(attackVariant, attacks.length - 1))] ??
          idle;
    const frameCount = Math.max(1, currentClip.frames);
    const frameMs = 1000 / (currentClip.fps ?? fps);
    const timer = setTimeout(() => {
      setFrame((current) => {
        if (mode === "attack" && current >= frameCount - 1) {
          setMode("idle");
          return 0;
        }
        return (current + 1) % frameCount;
      });
    }, frameMs);

    return () => clearTimeout(timer);
  }, [attackVariant, attacks, fps, frame, idle, mode]);

  const currentClip =
    mode === "idle"
      ? idle
      : attacks[Math.max(0, Math.min(attackVariant, attacks.length - 1))] ??
        idle;
  const row = currentClip.row;
  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const backgroundSize = `${sheetWidth * scale}px ${sheetHeight * scale}px`;
  const backgroundPosition = `${-frame * scaledFrameWidth}px ${-row * scaledFrameHeight}px`;

  return (
    <div
      className="rounded-2xl p-4 sw-surface"
      aria-label={mode === "attack" ? ariaLabelAttack : ariaLabelIdle}
    >
      <div
        className="relative mx-auto"
        style={{ width: scaledFrameWidth, height: scaledFrameHeight }}
      >
        <div
          style={{
            width: scaledFrameWidth,
            height: scaledFrameHeight,
            backgroundImage: `url('${spriteUrl}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize,
            backgroundPosition,
            imageRendering: "pixelated",
          }}
        />
        {flashOn ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "rgba(239, 68, 68, 0.5)",
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.5)",
              maskImage: `url('${spriteUrl}')`,
              maskRepeat: "no-repeat",
              maskSize: backgroundSize,
              maskPosition: backgroundPosition,
              WebkitMaskImage: `url('${spriteUrl}')`,
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: backgroundSize,
              WebkitMaskPosition: backgroundPosition,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
