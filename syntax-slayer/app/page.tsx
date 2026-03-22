import Link from "next/link";

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Syntax Slayer</h1>
      <Link href="/game" className="px-4 py-2 bg-black text-white rounded">
        Start Game
      </Link>
    </main>
  );
}