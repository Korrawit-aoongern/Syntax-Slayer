"use client";

import { useEffect, useMemo, useState } from "react";
import Card, { type CardFace } from "../components/Card";
import vocabData from "../data/vocab.json";

type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: "SE" | "CS" | "CE/CPE" | "IT" | "IS";
};

type GameCard = {
  id: string;
  pairId: string;
  face: CardFace;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const vocab = vocabData as VocabItem[];

const LEVEL_CONFIG = [
  { maxLevel: 4, rows: 2, cols: 3, pairs: 3 },
  { maxLevel: 8, rows: 4, cols: 4, pairs: 8 },
  { maxLevel: 10, rows: 6, cols: 6, pairs: 18 },
];

const getLevelConfig = (level: number) =>
  LEVEL_CONFIG.find((entry) => level <= entry.maxLevel) ?? LEVEL_CONFIG[0];

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const buildDeck = (items: VocabItem[], pairs: number): GameCard[] => {
  const picked = shuffle(items).slice(0, pairs);
  return shuffle(
    picked.flatMap((item) => [
      {
        id: `${item.id}-term`,
        pairId: item.id,
        face: "term" as const,
        text: item.term,
        isFlipped: false,
        isMatched: false,
      },
      {
        id: `${item.id}-meaning`,
        pairId: item.id,
        face: "meaning" as const,
        text: item.meaning,
        isFlipped: false,
        isMatched: false,
      },
    ]),
  );
};

export default function GamePage() {
  const level = 10;
  const { rows, cols, pairs } = getLevelConfig(level);
  const initialDeck = useMemo(() => buildDeck(vocab, pairs), [pairs]);
  const [cards, setCards] = useState<GameCard[]>(initialDeck);
  const [busy, setBusy] = useState(false);

  const flippedUnmatched = cards.filter(
    (card) => card.isFlipped && !card.isMatched,
  );

  useEffect(() => {
    if (flippedUnmatched.length !== 2) {
      return;
    }

    setBusy(true);
    const [first, second] = flippedUnmatched;
    const isMatch = first.pairId === second.pairId;

    const timer = setTimeout(() => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id === first.id || card.id === second.id) {
            return {
              ...card,
              isMatched: isMatch ? true : card.isMatched,
              isFlipped: isMatch ? true : false,
            };
          }
          return card;
        }),
      );
      setBusy(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [flippedUnmatched]);

  useEffect(() => {
    if (cards.length === 0) return;
    if (!cards.every((card) => card.isMatched)) return;

    setBusy(true);
    const timer = setTimeout(() => {
      setCards(buildDeck(vocab, pairs));
      setBusy(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [cards, pairs]);

  const handleFlip = (id: string) => {
    if (busy) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === id && !card.isFlipped && !card.isMatched
          ? { ...card, isFlipped: true }
          : card,
      ),
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Battle</h1>
        <p className="text-sm text-slate-500">
          Match term and meaning pairs. Wrong matches will later feed the enemy
          AP.
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Level {level} • Grid {rows}x{cols} • {pairs} pairs
        </p>
      </div>

      <div
        className={`grid gap-4 ${
          cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-6"
        }`}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            text={card.text}
            face={card.face}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            isLocked={busy}
            onFlip={handleFlip}
          />
        ))}
      </div>
    </div>
  );
}
