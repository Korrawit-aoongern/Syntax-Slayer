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

type GameView = "mainmenu" | "game" | "victory";

type SessionState = {
  view: GameView;
  level: number;
  player: PlayerState;
  enemy: EnemyState;
  cards: GameCard[];
  unlockedTerms: string[];
  selectedUpgrade: number | null;
};

const STORAGE_KEY = "syntax-slayer-session-v1";

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
  const [view, setView] = useState<GameView>("mainmenu");
  const [resumeView, setResumeView] = useState<GameView>("game");
  const [selectedUpgrade, setSelectedUpgrade] = useState<number | null>(null);
  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [hasSave, setHasSave] = useState(false);
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
  const [hydrated, setHydrated] = useState(false);

  const resolveKeyRef = useRef<string | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<PlayerState>(player);

  const flippedUnmatched = cards.filter(
    (card) => card.isFlipped && !card.isMatched,
  );
  const unlockedSet = useMemo(() => new Set(unlockedTerms), [unlockedTerms]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setView("mainmenu");
        setHydrated(true);
        return;
      }
      const data = JSON.parse(raw) as Partial<SessionState>;
      const loadedLevel =
        typeof data.level === "number" && data.level >= 1 ? data.level : 1;
      const { pairs: loadedPairs } = getLevelConfig(loadedLevel);

      setLevel(loadedLevel);
      const restoredView =
        data.view === "victory" || data.view === "mainmenu" ? data.view : "game";
      setResumeView(restoredView);
      setView("mainmenu");
      setPlayer(
        data.player ?? {
          hp: 1000,
          attack: 2,
          focus: 0,
          consumables: [null, null, null],
        },
      );
      setEnemy(
        data.enemy ?? {
          hp: ENEMY_STATS[loadedLevel]?.hp ?? 8,
          attack: ENEMY_STATS[loadedLevel]?.attack ?? 2,
          ap: 0,
          apThreshold: ENEMY_STATS[loadedLevel]?.apThreshold ?? 5,
        },
      );
      setCards(
        Array.isArray(data.cards) && data.cards.length > 0
          ? data.cards
          : buildDeck(vocab, loadedPairs),
      );
      setUnlockedTerms(
        Array.isArray(data.unlockedTerms) ? data.unlockedTerms : [],
      );
      setSelectedUpgrade(
        typeof data.selectedUpgrade === "number" ? data.selectedUpgrade : null,
      );

      setHasSave(true);
      setHydrated(true);
    } catch {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasSave && view === "mainmenu") return;
    const persistedView = view === "mainmenu" ? resumeView : view;
    const payload: SessionState = {
      view: persistedView,
      level,
      player,
      enemy,
      cards,
      unlockedTerms,
      selectedUpgrade,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    hasSave,
    view,
    resumeView,
    level,
    player,
    enemy,
    cards,
    unlockedTerms,
    selectedUpgrade,
  ]);

  useEffect(() => {
    if (view !== "mainmenu") {
      setResumeView(view);
    }
  }, [view]);

  useEffect(() => {
    if (view !== "game") {
      resolveKeyRef.current = null;
      return;
    }
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
        const critChance = clamp(currentPlayer.focus, 0, 100) / 100;
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

        setUnlockedTerms((prev) =>
          prev.includes(first.pairId) ? prev : [...prev, first.pairId],
        );
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
  }, [flippedUnmatched, view]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;

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
  }, [view, enemy.hp]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;
    if (enemy.ap < enemy.apThreshold) return;

    setEnemy((prev) =>
      prev.ap >= prev.apThreshold ? { ...prev, ap: 0 } : prev,
    );
    setPlayer((prev) => ({
      ...prev,
      hp: clamp(prev.hp - enemy.attack, 0, prev.hp),
      focus: clamp(prev.focus - 2, 0, 100),
    }));
  }, [enemy.ap, enemy.apThreshold, enemy.attack, enemy.hp, view]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;
    if (cards.length === 0) return;
    if (!cards.every((card) => card.isMatched)) return;

    setBusy(true);
    const timer = setTimeout(() => {
      setCards(buildDeck(vocab, pairs));
      setBusy(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [cards, pairs, view, enemy.hp]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp > 0) return;
    setView("victory");
  }, [enemy.hp, view]);

  const handleFlip = (id: string) => {
    if (view !== "game") return;
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
  const critChance = clamp(player.focus, 0, 100);

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const nextConfig = getLevelConfig(1);
    const nextEnemyStats = ENEMY_STATS[1];

    setHasSave(true);
    setLevel(1);
    setView("game");
    setResumeView("game");
    setSelectedUpgrade(null);
    setUnlockedTerms([]);
    setBusy(false);
    setPlayer({
      hp: 1000,
      attack: 2,
      focus: 0,
      consumables: [null, null, null],
    });
    setEnemy({
      hp: nextEnemyStats.hp,
      attack: nextEnemyStats.attack,
      ap: 0,
      apThreshold: nextEnemyStats.apThreshold,
    });
    setCards(buildDeck(vocab, nextConfig.pairs));
  };

  const handleResume = () => {
    setView(resumeView);
  };

  const handleNextLevel = () => {
    if (level >= 10) return;
    const nextLevel = Math.min(level + 1, 10);
    const nextConfig = getLevelConfig(nextLevel);
    const nextEnemyStats = ENEMY_STATS[nextLevel] ?? ENEMY_STATS[1];

    setLevel(nextLevel);
    setEnemy({
      hp: nextEnemyStats.hp,
      attack: nextEnemyStats.attack,
      ap: 0,
      apThreshold: nextEnemyStats.apThreshold,
    });
    setCards(buildDeck(vocab, nextConfig.pairs));
    setSelectedUpgrade(null);
    setBusy(false);
    setView("game");
  };

  const upgradeOptions = [
    "Placeholder Card A",
    "Placeholder Card B",
    "Placeholder Card C",
  ];

  if (view === "victory") {
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

  if (view === "mainmenu") {
    return (
      <div className="p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Main Menu
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Syntax Slayer</h1>
            <p className="mt-2 text-sm text-slate-600">
              Menu placeholder. Continue to return to battle.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasSave ? (
              <button
                type="button"
                onClick={handleResume}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Resume
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleNewGame}
              className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              {hasSave ? "New Game" : "Start Game"}
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
        {cards.map((card) => {
          const isUnlockedTerm =
            card.face === "term" && unlockedSet.has(card.pairId);
          return (
            <Card
              key={card.id}
              id={card.id}
              text={card.text}
              face={card.face}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              isLocked={busy}
              onFlip={handleFlip}
              className={isUnlockedTerm ? "ring-2 ring-emerald-400/70" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
