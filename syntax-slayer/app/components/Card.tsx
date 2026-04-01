"use client";

import type { CardFace, Category } from "../types/game";
import { getCategoryBorderClass } from "../utils/category";

type CardProps = {
  id: string;
  text: string;
  face: CardFace;
  category?: Category | null;
  isFlipped: boolean;
  isMatched: boolean;
  isLocked?: boolean;
  onFlip?: (id: string) => void;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Card({
  id,
  text,
  face,
  category,
  isFlipped,
  isMatched,
  isLocked = false,
  onFlip,
  className,
}: CardProps) {
  const isRevealed = isFlipped || isMatched;
  const disabled = isMatched || isLocked;
  const categoryBorder = getCategoryBorderClass(category);

  return (
    <button
      type="button"
      onClick={() => onFlip?.(id)}
      disabled={disabled}
      aria-pressed={isRevealed}
      aria-label={isRevealed ? `${face}: ${text}` : "Hidden card"}
      className={cx(
        "group relative h-32 w-full select-none overflow-hidden rounded-2xl border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70",
        isRevealed
          ? "shadow-[0_12px_28px_-14px_rgba(255,43,214,0.6)]"
          : "shadow-[0_12px_24px_-16px_rgba(34,211,238,0.35)]",
        categoryBorder,
        disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
        className,
      )}
    >
      <div
        className={cx(
          "absolute inset-0 rounded-[inherit] p-3 transition-all duration-200",
          isRevealed
            ? "bg-[radial-gradient(circle_at_top,#2c0a5b_0%,#16002e_55%,#0b001f_100%)] text-[#f8f0ff]"
            : "bg-[radial-gradient(circle_at_top,#1b0b3a_0%,#120026_60%,#0b001f_100%)] text-[#c9b6ff]",
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          {isRevealed ? (
            <>
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                  face === "term"
                    ? "bg-fuchsia-500/20 text-fuchsia-200"
                    : "bg-cyan-400/20 text-cyan-200",
                )}
              >
                {face}
              </span>
              <span className="text-sm font-semibold leading-snug">{text}</span>
            </>
          ) : (
            <span className="text-3xl font-bold text-cyan-200">?</span>
          )}
        </div>
      </div>

    </button>
  );
}
