"use client";

import Link from "next/link";
import useAudioManager from "./utils/useAudioManager";

export default function Home() {
  const audio = useAudioManager();

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 text-[var(--sw-text)]">
      <h1 className="text-3xl font-bold sw-title">Syntax Slayer</h1>
      <Link
        href="/game"
        onClick={() => {
          audio.unlock();
          audio.playSfx("click");
        }}
        className="px-4 py-2 rounded-full font-semibold sw-button-primary"
      >
        Start Game
      </Link>
    </main>
  );
}
