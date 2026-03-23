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
    <div className="h-[10vh] min-h-0 flex flex-col justify-center">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
        <span>AP Meter</span>
        <span>
          Level {level} - Grid {rows}x{cols} - {pairs} pairs
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all"
          style={{ width: `${apPercent}%` }}
        />
      </div>
    </div>
  );
}
