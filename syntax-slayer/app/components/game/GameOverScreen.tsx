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
        <div className="rounded-3xl p-6 sw-panel">
          <div className="text-xs uppercase tracking-[0.3em] sw-accent-rose">
            Game Over
          </div>
          <h1 className="mt-2 text-3xl font-semibold sw-title">
            You Were Defeated
          </h1>
          <div className="mt-4 flex justify-center">
            <img
              src="/img/Slayer-defeated.png"
              alt="Slayer defeated"
              className="max-h-48 w-auto"
            />
          </div>
          <p className="mt-2 text-sm sw-muted">
            Try again with new strategy and stronger upgrades.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-full px-6 py-2 text-sm font-semibold sw-button-primary"
          >
            New Game
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
