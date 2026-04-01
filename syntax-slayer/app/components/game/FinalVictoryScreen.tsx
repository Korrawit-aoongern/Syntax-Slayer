"use client";

import type { VocabItem } from "../../types/game";

type FinalVictoryScreenProps = {
  unlockedItems: VocabItem[];
  onBackToMenu: () => void;
};

export default function FinalVictoryScreen({
  unlockedItems,
  onBackToMenu,
}: FinalVictoryScreenProps) {
  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="rounded-3xl p-6 sw-panel">
          <div className="text-xs uppercase tracking-[0.3em] sw-accent-emerald">
            Victory
          </div>
          <h1 className="mt-2 text-3xl font-semibold sw-title">
            Boss Defeated — Campaign Complete
          </h1>
          <p className="mt-2 text-sm sw-muted">
            These are the terms you unlocked during your run.
          </p>
        </div>

        <div className="rounded-3xl p-6 sw-panel">
          <div className="text-xs uppercase tracking-[0.3em] sw-muted">
            Unlocked Terms
          </div>
          {unlockedItems.length === 0 ? (
            <p className="mt-3 text-sm sw-muted">No unlocked terms yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {unlockedItems.map((item) => (
                <div key={item.id} className="rounded-2xl p-4 sw-surface">
                  <div className="text-xs uppercase tracking-[0.2em] sw-muted">
                    {item.category}
                  </div>
                  <div className="mt-1 text-lg font-semibold sw-title">
                    {item.term}
                  </div>
                  <div className="mt-2 text-sm sw-muted">{item.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBackToMenu}
            className="rounded-full px-6 py-2 text-sm font-semibold sw-button-primary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
