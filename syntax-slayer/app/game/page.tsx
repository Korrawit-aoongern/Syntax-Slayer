"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type PlayerState = {
  hp: number;
  attack: number;
  focus: number;
  consumables: Array<string | null>;
};

type EnemyState = {
  hp: number;
  attack: number;
  ap: number;
  apThreshold: number;
};

const vocab = vocabData as VocabItem[];

const LEVEL_CONFIG = [
  { maxLevel: 4, rows: 2, cols: 3, pairs: 3 },
  { maxLevel: 8, rows: 4, cols: 4, pairs: 8 },
  { maxLevel: 10, rows: 6, cols: 6, pairs: 18 },
];

const ENEMY_STATS: Record<number, Omit<EnemyState, "ap">> = {
  1: { hp: 8, attack: 2, apThreshold: 5 },
  2: { hp: 14, attack: 2, apThreshold: 5 },
  3: { hp: 20, attack: 4, apThreshold: 4 },
  4: { hp: 28, attack: 4, apThreshold: 4 },
  5: { hp: 40, attack: 6, apThreshold: 5 },
  6: { hp: 52, attack: 6, apThreshold: 4 },
  7: { hp: 64, attack: 8, apThreshold: 4 },
  8: { hp: 80, attack: 8, apThreshold: 3 },
  9: { hp: 96, attack: 10, apThreshold: 4 },
  10: { hp: 120, attack: 10, apThreshold: 3 },
};

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function GamePage() {
  const [level, setLevel] = useState(1);
  const { rows, cols, pairs } = getLevelConfig(level);
  const enemyStats = ENEMY_STATS[level] ?? ENEMY_STATS[1];
  const initialDeck = useMemo(() => buildDeck(vocab, pairs), [pairs]);
  const [cards, setCards] = useState<GameCard[]>(initialDeck);
  const [busy, setBusy] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<number | null>(null);
  const [player, setPlayer] = useState<PlayerState>({
    hp: 1000,
    attack: 2,
    focus: 0,
    consumables: [null, null, null],
  });
  const [enemy, setEnemy] = useState<EnemyState>({
    hp: enemyStats.hp,
    attack: enemyStats.attack,
    ap: 0,
    apThreshold: enemyStats.apThreshold,
  });
  const resolveKeyRef = useRef<string | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<PlayerState>(player);
  const isVictory = enemy.hp <= 0;
  const upgradeOptions = [
    "Placeholder Card A",
    "Placeholder Card B",
    "Placeholder Card C",
  ];

  const flippedUnmatched = cards.filter(
    (card) => card.isFlipped && !card.isMatched,
  );

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    setEnemy({
      hp: enemyStats.hp,
      attack: enemyStats.attack,
      ap: 0,
      apThreshold: enemyStats.apThreshold,
    });
    setCards(buildDeck(vocab, pairs));
    setBusy(false);
    setSelectedUpgrade(null);
  }, [enemyStats.attack, enemyStats.apThreshold, enemyStats.hp, pairs]);

  useEffect(() => {
    if (flippedUnmatched.length !== 2) {
      resolveKeyRef.current = null;
      return;
    }

    const resolveKey = [...flippedUnmatched]
      .map((card) => card.id)
      .sort()
      .join("|");
    if (resolveTimerRef.current && resolveKeyRef.current === resolveKey) {
      return;
    }
    resolveKeyRef.current = resolveKey;
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }

    setBusy(true);
    const [first, second] = flippedUnmatched;
    const isMatch = first.pairId === second.pairId;

    resolveTimerRef.current = setTimeout(() => {
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

      if (isMatch) {
        const currentPlayer = playerRef.current;
        const critChance = clamp(
          Math.floor(currentPlayer.focus / 10) * 0.1,
          0,
          1,
        );
        const isCrit = Math.random() < critChance;
        const damage = currentPlayer.attack * (isCrit ? 2 : 1);
        const focusGain = currentPlayer.focus + 5;
        const instantKill = focusGain >= 100;

        setPlayer((prevPlayer) => ({
          ...prevPlayer,
          focus: instantKill ? 0 : focusGain,
        }));

        setEnemy((prevEnemy) => {
          const nextHp = instantKill
            ? 0
            : clamp(prevEnemy.hp - damage, 0, prevEnemy.hp);
          return { ...prevEnemy, hp: nextHp };
        });
      } else {
        setPlayer((prevPlayer) => ({ ...prevPlayer, focus: 0 }));
        setEnemy((prevEnemy) => ({
          ...prevEnemy,
          ap: clamp(prevEnemy.ap + 2, 0, prevEnemy.apThreshold),
        }));
      }

      setBusy(false);
      resolveKeyRef.current = null;
      resolveTimerRef.current = null;
    }, 700);

    return () => {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
        resolveKeyRef.current = null;
      }
    };
  }, [flippedUnmatched]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEnemy((prev) => {
        if (prev.hp <= 0) return prev;
        return {
          ...prev,
          ap: clamp(prev.ap + 1, 0, prev.apThreshold),
        };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (enemy.hp <= 0) return;
    if (enemy.ap < enemy.apThreshold) return;

    setEnemy((prev) =>
      prev.ap >= prev.apThreshold ? { ...prev, ap: 0 } : prev,
    );
    setPlayer((prev) => ({
      ...prev,
      hp: clamp(prev.hp - enemy.attack, 0, prev.hp),
      focus: clamp(prev.focus - 5, 0, 100),
    }));
  }, [enemy.ap, enemy.apThreshold, enemy.attack, enemy.hp]);

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
    if (flippedUnmatched.length >= 2) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === id && !card.isFlipped && !card.isMatched
          ? { ...card, isFlipped: true }
          : card,
      ),
    );
  };

  const apPercent =
    enemy.apThreshold === 0 ? 0 : (enemy.ap / enemy.apThreshold) * 100;
  const critChance = clamp(Math.floor(player.focus / 10) * 10, 0, 100);

  const handleNextLevel = () => {
    if (level >= 10) return;
    setLevel((prev) => Math.min(prev + 1, 10));
  };

  if (isVictory) {
    return (
      <div className="p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-amber-600">
              Victory
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Level {level} Cleared
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose one of the three upgrade cards below. (Placeholder)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {upgradeOptions.map((label, index) => {
              const isSelected = selectedUpgrade === index;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedUpgrade(index)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? "border-amber-400 bg-white shadow-[0_10px_24px_-16px_rgba(251,191,36,0.7)]"
                      : "border-slate-200/70 bg-white/80 hover:border-amber-300"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Upgrade Card
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">
                    {label}
                  </div>
                  <div className="mt-3 h-24 rounded-xl border border-dashed border-slate-200/70 bg-slate-50/70 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
                    Art slot
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Next level unlocks a new enemy
            </div>
            <button
              type="button"
              onClick={handleNextLevel}
              disabled={selectedUpgrade === null || level >= 10}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                selectedUpgrade === null || level >= 10
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {level >= 10 ? "Campaign Complete" : "Next Level"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Battle</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Player
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">HP</div>
              <div className="text-2xl font-semibold">{player.hp}</div>
            </div>
            <div>
              <div className="text-slate-500">ATK</div>
              <div className="text-2xl font-semibold">{player.attack}</div>
            </div>
            <div>
              <div className="text-slate-500">Focus</div>
              <div className="text-2xl font-semibold">{player.focus}</div>
              <div className="text-xs text-slate-400">Crit {critChance}%</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Consumables
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {player.consumables.map((item, index) => (
                <div
                  key={`slot-${index}`}
                  className="flex h-10 items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 text-[10px] uppercase tracking-[0.2em] text-slate-400"
                >
                  {item ?? "Empty"}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-6 text-center text-sm text-slate-400">
            Player art slot
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-right shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Enemy
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">HP</div>
              <div className="text-2xl font-semibold">{enemy.hp}</div>
            </div>
            <div>
              <div className="text-slate-500">ATK</div>
              <div className="text-2xl font-semibold">{enemy.attack}</div>
            </div>
            <div>
              <div className="text-slate-500">AP</div>
              <div className="text-2xl font-semibold">
                {enemy.ap}/{enemy.apThreshold}
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-6 text-center text-sm text-slate-400">
            Enemy art slot
          </div>
        </div>
      </div>

      <div className="my-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
          <span>AP Meter</span>
          <span>
            Level {level} - Grid {rows}x{cols} - {pairs} pairs
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all"
            style={{ width: `${apPercent}%` }}
          />
        </div>
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
