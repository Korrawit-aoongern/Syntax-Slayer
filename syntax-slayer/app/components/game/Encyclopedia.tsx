"use client";

import { useMemo, useState } from "react";
import type { Category, VocabItem } from "../../types/game";
import { getCategoryBorderClass } from "../../utils/category";

type EncyclopediaProps = {
  vocab: VocabItem[];
  unlockedTerms: string[];
  onBack: () => void;
  onResetProgression: () => void;
};

export default function Encyclopedia({
  vocab,
  unlockedTerms,
  onBack,
  onResetProgression,
}: EncyclopediaProps) {
  const unlockedSet = useMemo(() => new Set(unlockedTerms), [unlockedTerms]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">(
    "all",
  );

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return vocab.filter((item) => {
      const unlocked = unlockedSet.has(item.id);
      if (statusFilter === "unlocked" && !unlocked) return false;
      if (statusFilter === "locked" && unlocked) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (lowered.length === 0) return true;
      return (
        item.term.toLowerCase().includes(lowered) ||
        item.meaning.toLowerCase().includes(lowered) ||
        item.description.toLowerCase().includes(lowered)
      );
    });
  }, [categoryFilter, query, statusFilter, unlockedSet, vocab]);

  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Encyclopedia
            </div>
            <h1 className="mt-2 text-3xl font-semibold">IT Vocabulary</h1>
            <p className="mt-2 text-sm text-slate-600">
              Discovered terms can be opened to read full details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset progression? This will lock all encyclopedia entries.",
                  )
                ) {
                  onResetProgression();
                  setOpenId(null);
                }
              }}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300"
            >
              Reset Progression
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Back
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search term, meaning, or description"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as Category | "all")
              }
              className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="SE">SE</option>
              <option value="CS">CS</option>
              <option value="CPE">CE/CPE</option>
              <option value="IT">IT</option>
              <option value="IS">IS</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "unlocked" | "locked")
              }
              className="rounded-full border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="grid grid-flow-col auto-cols-[9rem] grid-rows-[repeat(5,9rem)] gap-3">
          {filtered.map((item) => {
            const unlocked = unlockedSet.has(item.id);
            const isOpen = openId === item.id;
            const borderClass = getCategoryBorderClass(item.category);
            const metaClass = unlocked ? "text-slate-300" : "text-slate-400";
            const badgeClass = unlocked
              ? "border-slate-200/40 text-slate-200"
              : "border-slate-200/60 text-slate-500";
            const termClass = unlocked ? "text-white" : "text-slate-900";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  unlocked
                    ? setOpenId((prev) => (prev === item.id ? null : item.id))
                    : null
                }
                disabled={!unlocked}
                className={`rounded-2xl border p-3 text-left transition ${borderClass} ${
                  unlocked
                    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white hover:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.6)]"
                    : "bg-slate-50 text-slate-400"
                } ${!unlocked ? "cursor-not-allowed" : ""}`}
                aria-expanded={isOpen}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`text-[10px] uppercase tracking-[0.2em] ${metaClass}`}>
                      {item.category}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${termClass}`}>
                      {item.term}
                    </div>
                  </div>
                  <span className="sr-only">{item.difficulty}</span>
                </div>

                {unlocked ? (
                  <div className="mt-3 text-xs">
                    <span className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                      Click to read
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Locked
                  </div>
                )}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {openId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.6)]">
            {(() => {
              const current = vocab.find((item) => item.id === openId);
              if (!current) return null;
              return (
                <>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {current.category}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {current.term}
                  </h2>
                  <div className="mt-2 inline-flex rounded-full border border-slate-200 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {current.difficulty}
                  </div>
                  <div className="mt-4 text-base font-semibold text-slate-800">
                    {current.meaning}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {current.description}
                  </p>
                </>
              );
            })()}
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
