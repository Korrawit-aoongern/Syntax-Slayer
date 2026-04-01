"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BGM_TRACKS, SFX_TRACKS, type BgmId, type SfxId } from "../data/audioConfig";

type AudioSettings = {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
};

const STORAGE_KEY = "syntax-slayer-audio-v1";
const DEFAULT_SETTINGS: AudioSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.7,
  musicMuted: false,
  sfxMuted: false,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function useAudioManager() {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmRef = useRef<BgmId | null>(null);
  const unlockedRef = useRef(false);
  const sfxCacheRef = useRef<Record<SfxId, HTMLAudioElement>>({} as Record<
    SfxId,
    HTMLAudioElement
  >);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      setSettings((prev) => ({
        musicVolume: clamp01(parsed.musicVolume ?? prev.musicVolume),
        sfxVolume: clamp01(parsed.sfxVolume ?? prev.sfxVolume),
        musicMuted: typeof parsed.musicMuted === "boolean" ? parsed.musicMuted : prev.musicMuted,
        sfxMuted: typeof parsed.sfxMuted === "boolean" ? parsed.sfxMuted : prev.sfxMuted,
      }));
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  useEffect(() => {
    if (!bgmRef.current) return;
    bgmRef.current.volume = settings.musicMuted ? 0 : settings.musicVolume;
  }, [settings.musicMuted, settings.musicVolume]);

  const unlock = useCallback(() => {
    unlockedRef.current = true;
    if (bgmRef.current) {
      bgmRef.current
        .play()
        .then(() => undefined)
        .catch(() => undefined);
    }
  }, []);

  const setBgm = useCallback(
    (bgmId: BgmId | null) => {
      if (!bgmId) {
        if (bgmRef.current) {
          bgmRef.current.pause();
        }
        currentBgmRef.current = null;
        return;
      }

      const track = BGM_TRACKS[bgmId];
      if (!track) return;

      if (!bgmRef.current) {
        bgmRef.current = new Audio(track.src);
        bgmRef.current.autoplay = true;
      }

      const audio = bgmRef.current;
      if (currentBgmRef.current !== bgmId) {
        audio.pause();
        audio.src = track.src;
        audio.loop = track.loop;
        audio.currentTime = 0;
        currentBgmRef.current = bgmId;
      }

      audio.volume = settings.musicMuted ? 0 : settings.musicVolume;
      audio
        .play()
        .then(() => undefined)
        .catch(() => undefined);
    },
    [settings.musicMuted, settings.musicVolume],
  );

  const playSfx = useCallback(
    (sfxId: SfxId) => {
      if (!unlockedRef.current) return;
      if (settings.sfxMuted) return;
      const track = SFX_TRACKS[sfxId];
      if (!track) return;

      if (!sfxCacheRef.current[sfxId]) {
        const base = new Audio(track.src);
        base.preload = "auto";
        sfxCacheRef.current[sfxId] = base;
      }

      const base = sfxCacheRef.current[sfxId];
      const sound = base.cloneNode(true) as HTMLAudioElement;
      sound.volume = clamp01(settings.sfxVolume);
      sound
        .play()
        .then(() => undefined)
        .catch(() => undefined);
    },
    [settings.sfxMuted, settings.sfxVolume],
  );

  const actions = useMemo(
    () => ({
      setMusicMuted: (value: boolean) =>
        setSettings((prev) => ({ ...prev, musicMuted: value })),
      setSfxMuted: (value: boolean) =>
        setSettings((prev) => ({ ...prev, sfxMuted: value })),
      setMusicVolume: (value: number) =>
        setSettings((prev) => ({ ...prev, musicVolume: clamp01(value) })),
      setSfxVolume: (value: number) =>
        setSettings((prev) => ({ ...prev, sfxVolume: clamp01(value) })),
    }),
    [],
  );

  const stopAll = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
    currentBgmRef.current = null;
  }, []);

  return {
    ...settings,
    unlock,
    setBgm,
    playSfx,
    stopAll,
    ...actions,
  };
}
