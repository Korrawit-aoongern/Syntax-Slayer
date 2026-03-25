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
        <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-600">
            Victory
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Boss Defeated — Campaign Complete
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            These are the terms you unlocked during your run.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Unlocked Terms
          </div>
          {unlockedItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No unlocked terms yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {unlockedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.category}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {item.term}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.meaning}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBackToMenu}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
