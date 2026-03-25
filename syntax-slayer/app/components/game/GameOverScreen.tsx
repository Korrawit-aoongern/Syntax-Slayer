"use client";

type GameOverScreenProps = {
  onMainMenu: () => void;
  onNewGame: () => void;
};

export default function GameOverScreen({
  onMainMenu,
  onNewGame,
}: GameOverScreenProps) {
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-3xl border border-rose-200/70 bg-rose-50/70 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-rose-600">
            Game Over
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            You Were Defeated
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Try again with new strategy and stronger upgrades.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New Game
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
