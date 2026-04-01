"use client";

type ApBarProps = {
  apPercent: number;
  level: number;
  rows: number;
  cols: number;
  pairs: number;
};

export default function ApBar({ apPercent, level, rows, cols, pairs }: ApBarProps) {
  return (
    <div className="h-[8vh] sm:h-[10vh] min-h-0 flex flex-col justify-center">
      <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.25em] sw-muted">
        <span>AP Meter</span>
        <span className="hidden sm:inline">
          Level {level} - Grid {rows}x{cols} - {pairs} pairs
        </span>
        <span className="sm:hidden">L{level}</span>
      </div>
      <div className="mt-2 sm:mt-3 h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-[rgba(12,5,32,0.7)] border border-[var(--sw-border-soft)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 transition-all"
          style={{ width: `${apPercent}%` }}
        />
      </div>
    </div>
  );
}
