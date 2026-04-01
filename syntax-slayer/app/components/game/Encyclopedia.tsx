"use client";

import { useMemo, useState } from "react";
import type { Category, VocabItem } from "../../types/game";
import itemsData from "../../data/items.json";
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
  const items = itemsData as {
    id: string;
    name: string;
    image?: string;
    description: string;
    effect: string;
  }[];
  const unlockedSet = useMemo(() => new Set(unlockedTerms), [unlockedTerms]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
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
            <div className="text-xs uppercase tracking-[0.3em] sw-muted">
              Encyclopedia
            </div>
            <h1 className="mt-2 text-3xl font-semibold sw-title">
              IT Vocabulary
            </h1>
            <p className="mt-2 text-sm sw-muted">
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
              className="rounded-full border border-[var(--sw-danger)]/60 bg-[rgba(255,107,136,0.15)] px-5 py-2 text-sm font-semibold text-[var(--sw-danger)]"
            >
              Reset Progression
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full px-5 py-2 text-sm font-semibold sw-button-secondary"
            >
              Back
            </button>
          </div>
        </div>

        <div className="rounded-3xl p-4 sw-panel">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search encyclopedia"
              className="flex-1 rounded-full border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-4 py-2 text-sm text-[var(--sw-text)]"
            />
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as Category | "all")
              }
              className="rounded-full border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-4 py-2 text-sm text-[var(--sw-text)]"
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
              className="rounded-full border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] px-4 py-2 text-sm text-[var(--sw-text)]"
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
            const metaClass = unlocked ? "text-[var(--sw-muted)]" : "text-[var(--sw-muted)]";
            const termClass = unlocked ? "text-[var(--sw-text)]" : "text-[var(--sw-muted)]";
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
                    ? "bg-[radial-gradient(circle_at_top,#2c0a5b_0%,#16002e_55%,#0b001f_100%)] text-[var(--sw-text)] hover:shadow-[0_12px_24px_-18px_rgba(255,43,214,0.45)]"
                    : "bg-[rgba(12,5,32,0.6)] text-[var(--sw-muted)]"
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
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--sw-success)]">
                      Click to read
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs uppercase tracking-[0.2em] sw-muted">
                    Locked
                  </div>
                )}
              </button>
            );
          })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] sw-muted">
            Items
          </div>
          <h2 className="mt-2 text-2xl font-semibold sw-title">Consumables</h2>
          <p className="mt-2 text-sm sw-muted">
            Collectible battle items with special effects.
          </p>
        </div>

        <div className="pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => {
              const isOpen = openItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setOpenItemId((prev) => (prev === item.id ? null : item.id))
                  }
                  className="rounded-2xl border border-[var(--sw-border)] p-3 text-left text-[var(--sw-text)] transition bg-[radial-gradient(circle_at_top,#2c0a5b_0%,#16002e_55%,#0b001f_100%)] hover:shadow-[0_12px_24px_-18px_rgba(255,43,214,0.45)]"
                  aria-expanded={isOpen}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[rgba(12,5,32,0.6)] border border-[var(--sw-border-soft)]">
                      <img
                        src={item.image ?? `/img/${item.id}.png`}
                        alt={item.name}
                        className="max-h-14 w-auto"
                      />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] sw-muted">
                      {item.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--sw-success)]">
                      Click to read
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {openId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b001f]/80 p-6">
          <div className="relative w-full max-w-xl rounded-3xl p-6 sw-panel">
            {(() => {
              const current = vocab.find((item) => item.id === openId);
              if (!current) return null;
              return (
                <>
                  <div className="text-xs uppercase tracking-[0.3em] sw-muted">
                    {current.category}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold sw-title">
                    {current.term}
                  </h2>
                  <div className="mt-2 inline-flex rounded-full border border-[var(--sw-border-soft)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] sw-muted">
                    {current.difficulty}
                  </div>
                  <div className="mt-4 text-base font-semibold sw-title">
                    {current.meaning}
                  </div>
                  <p className="mt-2 text-sm sw-muted">
                    {current.description}
                  </p>
                </>
              );
            })()}
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold sw-button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {openItemId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b001f]/80 p-6">
          <div className="relative w-full max-w-xl rounded-3xl p-6 sw-panel">
            {(() => {
              const current = items.find((entry) => entry.id === openItemId);
              if (!current) return null;
              return (
                <>
                  <div className="text-xs uppercase tracking-[0.3em] sw-muted">
                    Consumable
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold sw-title">
                    {current.name}
                  </h2>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)]">
                      <img
                        src={current.image ?? `/img/${current.id}.png`}
                        alt={current.name}
                        className="max-h-16 w-auto"
                      />
                    </div>
                    <div className="text-sm sw-muted">
                      {current.description}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-[var(--sw-success)]/40 bg-[rgba(54,245,194,0.1)] px-4 py-3 text-sm text-[var(--sw-success)]">
                    {current.effect}
                  </div>
                </>
              );
            })()}
            <button
              type="button"
              onClick={() => setOpenItemId(null)}
              className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold sw-button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
