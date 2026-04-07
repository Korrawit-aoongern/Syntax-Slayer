"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, GameMode, TermFilter } from "../../types/game";

type MainMenuProps = {
  hasSave: boolean;
  onResume: () => void;
  onNewGame: () => void;
  onOpenEncyclopedia: () => void;
  onSettingsClick: () => void;
  onFilterClick: () => void;
  onModeClick: () => void;
  gameMode: GameMode;
  onSelectMode: (value: GameMode) => void;
  termFilter: TermFilter;
  customCategories: Category[];
  onSelectFilter: (value: TermFilter) => void;
  onChangeCustomCategories: (value: Category[]) => void;
  musicMuted: boolean;
  sfxMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  onToggleMusic: (value: boolean) => void;
  onToggleSfx: (value: boolean) => void;
  onChangeMusicVolume: (value: number) => void;
  onChangeSfxVolume: (value: number) => void;
};

export default function MainMenu({
  hasSave,
  onResume,
  onNewGame,
  onOpenEncyclopedia,
  onSettingsClick,
  onFilterClick,
  onModeClick,
  gameMode,
  onSelectMode,
  termFilter,
  customCategories,
  onSelectFilter,
  onChangeCustomCategories,
  musicMuted,
  sfxMuted,
  musicVolume,
  sfxVolume,
  onToggleMusic,
  onToggleSfx,
  onChangeMusicVolume,
  onChangeSfxVolume,
}: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showModes && !showFilters) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (showModes && modeMenuRef.current && target) {
        if (!modeMenuRef.current.contains(target)) {
          setShowModes(false);
        }
      }
      if (showFilters && filterMenuRef.current && target) {
        if (!filterMenuRef.current.contains(target)) {
          setShowFilters(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showFilters, showModes]);

  const modeOptions: Array<{
    id: GameMode;
    label: string;
    description: string;
  }> = [
    {
      id: "hard",
      label: "Hard",
      description:
        "Unforgiving, Don't even try, Hardest Experience, Card instantly hide, No card ghosting when wrong, No Auto-heal when level up.",
    },
    {
      id: "classic",
      label: "Classic",
      description: "Normal Gameplay Experience, Mix of Challenges.",
    },
    {
      id: "easy",
      label: "Easy",
      description:
        "Recommend gameplay mode for relaxing or learning experience, Enemies are slower to attack, card stay as long as you want, no penalty when wrong",
    },
  ];

  const filterOptions: Array<{ id: TermFilter; label: string }> = [
    { id: "random", label: "Random" },
    { id: "SE", label: "SE Only" },
    { id: "CPE", label: "CPE/CE Only" },
    { id: "CS", label: "CS Only" },
    { id: "IT", label: "IT Only" },
    { id: "IS", label: "IS Only" },
    { id: "custom", label: "Custom" },
  ];

  const customOptions: Array<{ id: Category; label: string }> = [
    { id: "SE", label: "SE" },
    { id: "CPE", label: "CPE/CE" },
    { id: "CS", label: "CS" },
    { id: "IT", label: "IT" },
    { id: "IS", label: "IS" },
  ];

  const handleSelectFilter = (value: TermFilter) => {
    onSelectFilter(value);
    if (value === "custom" && customCategories.length === 0) {
      onChangeCustomCategories(["SE"]);
    }
  };

  const toggleCustomCategory = (category: Category) => {
    const next = customCategories.includes(category)
      ? customCategories.filter((value) => value !== category)
      : [...customCategories, category];
    if (next.length === 0) return;
    onChangeCustomCategories(next);
  };

  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="flex-1">
          <div className="rounded-3xl p-6 sw-panel">
            <div className="text-xs uppercase tracking-[0.3em] sw-muted">
              Main Menu
            </div>
            <h1 className="mt-2 text-3xl font-semibold sw-title">
              Syntax Slayer
            </h1>
            <p className="mt-2 text-sm sw-muted">
              Resume your last battle or start a fresh run.
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 flex flex-col gap-4">
          <div className="rounded-3xl p-4 sw-panel">
            <div className="flex flex-col gap-3">
              {hasSave ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="w-full rounded-full px-6 py-2 text-sm font-semibold sw-button-primary"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                    Resume
                  </span>
                </button>
              ) : null}

              <div className="relative" ref={modeMenuRef}>
                <div className="flex w-full overflow-hidden rounded-full sw-button-secondary">
                  <button
                    type="button"
                    onClick={onNewGame}
                    className="flex-1 px-4 py-2 text-sm font-semibold"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {hasSave ? "New Game" : "Start Game"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onModeClick();
                      setShowModes((prev) => !prev);
                    }}
                    className="px-3 border-l border-[var(--sw-border)]"
                    aria-haspopup="menu"
                    aria-expanded={showModes}
                  >
                    v
                  </button>
                </div>

                {showModes ? (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl p-4 sw-panel">
                    <div className="text-xs uppercase tracking-[0.3em] sw-muted">
                      Mode Select
                    </div>
                    <div className="mt-3 grid gap-2">
                      {modeOptions.map((option) => {
                        const isActive = gameMode === option.id;
                        return (
                          <div key={option.id} className="group relative">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMode(option.id);
                                setShowModes(false);
                              }}
                              className={`w-full rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                                isActive
                                  ? "border-[var(--sw-accent)] bg-[rgba(255,43,214,0.12)] text-[var(--sw-accent)]"
                                  : "border-[var(--sw-border)] bg-[rgba(12,5,32,0.6)] text-[var(--sw-text)] hover:border-[var(--sw-cyan)]"
                              }`}
                            >
                              {option.label}
                            </button>
                            <div className="pointer-events-none absolute left-full top-1/2 z-30 hidden w-64 -translate-y-1/2 rounded-2xl border border-[var(--sw-border)] bg-[rgba(12,5,32,0.9)] p-3 text-xs text-[var(--sw-text)] shadow-lg group-hover:block">
                              {option.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={filterMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    onFilterClick();
                    setShowFilters((prev) => !prev);
                  }}
                  className="w-full rounded-full px-4 py-2 text-sm font-semibold sw-button-secondary"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Filters
                  </span>
                </button>

                {showFilters ? (
                  <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl p-4 sw-panel">
                    <div className="text-xs uppercase tracking-[0.3em] sw-muted">
                      Term Filters
                    </div>
                    <div className="mt-3 grid gap-2">
                      {filterOptions.map((option) => {
                        const isActive = termFilter === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectFilter(option.id)}
                            className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                              isActive
                                ? "border-[var(--sw-accent)] bg-[rgba(255,43,214,0.12)] text-[var(--sw-accent)]"
                                : "border-[var(--sw-border)] bg-[rgba(12,5,32,0.6)] text-[var(--sw-text)] hover:border-[var(--sw-cyan)]"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {termFilter === "custom" ? (
                      <div className="mt-3 rounded-2xl border border-[var(--sw-border-soft)] bg-[rgba(12,5,32,0.6)] p-3">
                        <div className="text-[10px] uppercase tracking-[0.25em] sw-muted">
                          Custom Categories (Pick at Least One)
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {customOptions.map((option) => {
                            const isSelected = customCategories.includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleCustomCategory(option.id)}
                                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                                  isSelected
                                    ? "border border-[var(--sw-cyan)] bg-[rgba(34,211,238,0.12)] text-[var(--sw-cyan)]"
                                    : "border border-[var(--sw-border)] bg-[rgba(12,5,32,0.5)] text-[var(--sw-text)] hover:border-[var(--sw-cyan)]"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onOpenEncyclopedia}
                className="w-full rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 0-2 2V4z" />
                    <path d="M6 20a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  Encyclopedia
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSettingsClick();
                  setShowSettings((prev) => !prev);
                }}
                className="w-full rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm9 3.5a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4.9a7.8 7.8 0 0 0-1.8-1l-.4-2.6h-4l-.4 2.6a7.8 7.8 0 0 0-1.8 1l-2.4-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-.9a7.8 7.8 0 0 0 1.8 1l.4 2.6h4l.4-2.6a7.8 7.8 0 0 0 1.8-1l2.4.9 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
                  </svg>
                  Settings
                </span>
              </button>
            </div>
          </div>

          {showSettings ? (
            <div className="rounded-3xl p-6 sw-panel">
              <div className="text-xs uppercase tracking-[0.3em] sw-muted">
                Audio
              </div>
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl p-4 sw-surface">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold sw-title">
                      Music
                    </div>
                    <label className="flex items-center gap-2 text-xs sw-muted">
                      <input
                        type="checkbox"
                        checked={!musicMuted}
                        onChange={(event) => onToggleMusic(!event.target.checked)}
                      />
                      {musicMuted ? "Muted" : "On"}
                    </label>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(musicVolume * 100)}
                    onChange={(event) =>
                      onChangeMusicVolume(Number(event.target.value) / 100)
                    }
                    className="mt-3 w-full"
                  />
                </div>
                <div className="rounded-2xl p-4 sw-surface">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold sw-title">SFX</div>
                    <label className="flex items-center gap-2 text-xs sw-muted">
                      <input
                        type="checkbox"
                        checked={!sfxMuted}
                        onChange={(event) => onToggleSfx(!event.target.checked)}
                      />
                      {sfxMuted ? "Muted" : "On"}
                    </label>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(sfxVolume * 100)}
                    onChange={(event) =>
                      onChangeSfxVolume(Number(event.target.value) / 100)
                    }
                    className="mt-3 w-full"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
