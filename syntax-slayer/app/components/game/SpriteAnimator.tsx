"use client";

import { useEffect, useRef, useState } from "react";

type SpriteAnimatorProps = {
  spriteUrl: string;
  sheetWidth: number;
  sheetHeight: number;
  frameWidth: number;
  frameHeight: number;
  idleFrames: number;
  attackFrames: number;
  fps?: number;
  scale?: number;
  attackSignal: number;
  hitSignal: number;
  ariaLabelIdle: string;
  ariaLabelAttack: string;
};

export default function SpriteAnimator({
  spriteUrl,
  sheetWidth,
  sheetHeight,
  frameWidth,
  frameHeight,
  idleFrames,
  attackFrames,
  fps = 5,
  scale = 6,
  attackSignal,
  hitSignal,
  ariaLabelIdle,
  ariaLabelAttack,
}: SpriteAnimatorProps) {
  const [mode, setMode] = useState<"idle" | "attack">("idle");
  const [frame, setFrame] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const lastSignalRef = useRef(attackSignal);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (attackSignal === lastSignalRef.current) return;
    lastSignalRef.current = attackSignal;
    setMode("attack");
    setFrame(0);
  }, [attackSignal]);

  useEffect(() => {
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
    const frameCount = mode === "idle" ? idleFrames : attackFrames;
    const frameMs = 1000 / fps;
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
  }, [attackFrames, fps, idleFrames, frame, mode]);

  const row = mode === "idle" ? 0 : 1;
  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  const backgroundSize = `${sheetWidth * scale}px ${sheetHeight * scale}px`;
  const backgroundPosition = `${-frame * scaledFrameWidth}px ${-row * scaledFrameHeight}px`;

  return (
    <div
      className="rounded-2xl bg-slate-900/5 p-4"
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
