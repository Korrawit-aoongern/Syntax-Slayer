"use client";

type MainMenuProps = {
  hasSave: boolean;
  onResume: () => void;
  onNewGame: () => void;
  onOpenEncyclopedia: () => void;
};

export default function MainMenu({
  hasSave,
  onResume,
  onNewGame,
  onOpenEncyclopedia,
}: MainMenuProps) {
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Main Menu
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Syntax Slayer</h1>
          <p className="mt-2 text-sm text-slate-600">
            Resume your last battle or start a fresh run.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasSave ? (
            <button
              type="button"
              onClick={onResume}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Resume
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {hasSave ? "New Game" : "Start Game"}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenEncyclopedia}
          className="w-fit rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          Encyclopedia
        </button>
      </div>
    </div>
  );
}
