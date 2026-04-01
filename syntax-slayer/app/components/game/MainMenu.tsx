"use client";

import { useState } from "react";

type MainMenuProps = {
  hasSave: boolean;
  onResume: () => void;
  onNewGame: () => void;
  onOpenEncyclopedia: () => void;
  onSettingsClick: () => void;
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

  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
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
        <div className="flex flex-wrap gap-3">
          {hasSave ? (
            <button
              type="button"
              onClick={onResume}
              className="rounded-full px-6 py-2 text-sm font-semibold sw-button-primary"
            >
              Resume
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
          >
            {hasSave ? "New Game" : "Start Game"}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenEncyclopedia}
          className="w-fit rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
        >
          Encyclopedia
        </button>
        <button
          type="button"
          onClick={() => {
            onSettingsClick();
            setShowSettings((prev) => !prev);
          }}
          className="w-fit rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
        >
          Settings
        </button>

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
  );
}
