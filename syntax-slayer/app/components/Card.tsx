"use client";

export type CardFace = "term" | "meaning";

type CardProps = {
  id: string;
  text: string;
  face: CardFace;
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
  isFlipped,
  isMatched,
  isLocked = false,
  onFlip,
  className,
}: CardProps) {
  const isRevealed = isFlipped || isMatched;
  const disabled = isMatched || isLocked;

  return (
    <button
      type="button"
      onClick={() => onFlip?.(id)}
      disabled={disabled}
      aria-pressed={isRevealed}
      aria-label={isRevealed ? `${face}: ${text}` : "Hidden card"}
      className={cx(
        "group relative h-32 w-full select-none rounded-2xl border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
        isRevealed
          ? "border-amber-400/60 shadow-[0_10px_24px_-12px_rgba(251,191,36,0.6)]"
          : "border-slate-200/80 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.35)]",
        disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
        className,
      )}
    >
      <div
        className={cx(
          "absolute inset-0 rounded-[inherit] p-3 transition-all duration-200",
          isRevealed
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white"
            : "bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-500",
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          {isRevealed ? (
            <>
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                  face === "term"
                    ? "bg-amber-400/20 text-amber-200"
                    : "bg-sky-400/20 text-sky-200",
                )}
              >
                {face}
              </span>
              <span className="text-sm font-semibold leading-snug">{text}</span>
            </>
          ) : (
            <span className="text-3xl font-bold text-slate-300">?</span>
          )}
        </div>
      </div>

      {isLocked && !isMatched ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-slate-900/40 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
          Locked
        </div>
      ) : null}
    </button>
  );
}
