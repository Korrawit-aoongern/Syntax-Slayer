"use client";

import { useEffect, useRef, useState } from "react";

type PlayerSpriteProps = {
  attackSignal: number;
  hitSignal: number;
};

const FRAME_MS = 200;
const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;
const SHEET_WIDTH = 80;
const SHEET_HEIGHT = 32;
const IDLE_FRAMES = 4;
const ATTACK_FRAMES = 5;
const SCALE = 6;

export default function PlayerSprite({
  attackSignal,
  hitSignal,
}: PlayerSpriteProps) {
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
    const frameCount = mode === "idle" ? IDLE_FRAMES : ATTACK_FRAMES;
    const timer = setTimeout(() => {
      setFrame((current) => {
        if (mode === "attack" && current >= frameCount - 1) {
          setMode("idle");
          return 0;
        }
        return (current + 1) % frameCount;
      });
    }, FRAME_MS);

    return () => clearTimeout(timer);
  }, [frame, mode]);

  const row = mode === "idle" ? 0 : 1;
  const scaledFrameWidth = FRAME_WIDTH * SCALE;
  const scaledFrameHeight = FRAME_HEIGHT * SCALE;
  const backgroundSize = `${SHEET_WIDTH * SCALE}px ${SHEET_HEIGHT * SCALE}px`;
  const backgroundPosition = `${-frame * scaledFrameWidth}px ${-row * scaledFrameHeight}px`;

  return (
    <div
      className="rounded-2xl bg-slate-900/5 p-4"
      aria-label={
        mode === "attack" ? "Player attack animation" : "Player idle animation"
      }
    >
      <div className="relative mx-auto" style={{ width: scaledFrameWidth, height: scaledFrameHeight }}>
        <div
          style={{
            width: scaledFrameWidth,
            height: scaledFrameHeight,
            backgroundImage: "url('/img/Slayer.png')",
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
              maskImage: "url('/img/Slayer.png')",
              maskRepeat: "no-repeat",
              maskSize: backgroundSize,
              maskPosition: backgroundPosition,
              WebkitMaskImage: "url('/img/Slayer.png')",
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
