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
  consumables: Array<ConsumableId | null>;
  shield: number;
  attackBoost: number;
  attackBoostUntil: number;
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

type ConsumableId =
  | "minor_reveal"
  | "major_reveal"
  | "cosmic_reveal"
  | "freeze"
  | "obsidian_shield"
  | "holyxaliber"
  | "bandage"
  | "med_kit"
  | "holy_heal";

const STORAGE_KEY = "syntax-slayer-session-v1";

const vocab = vocabData as VocabItem[];

const LEVEL_CONFIG = [
  { maxLevel: 4, rows: 2, cols: 3, pairs: 3 },
  { maxLevel: 8, rows: 2, cols: 4, pairs: 4 },
  { maxLevel: 10, rows: 2, cols: 6, pairs: 6 },
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

const CONSUMABLE_POOL: ConsumableId[] = [
  "minor_reveal",
  "major_reveal",
  "cosmic_reveal",
  "freeze",
  "obsidian_shield",
  "holyxaliber",
  "bandage",
  "med_kit",
  "holy_heal",
];

const CONSUMABLE_LABELS: Record<ConsumableId, string> = {
  minor_reveal: "Minor Reveal",
  major_reveal: "Major Reveal",
  cosmic_reveal: "Cosmic Reveal",
  freeze: "Freeze",
  obsidian_shield: "Obsidian Shield",
  holyxaliber: "Holyxaliber",
  bandage: "Bandage",
  med_kit: "Med Kit",
  holy_heal: "Holy Heal",
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

const createDefaultPlayer = (): PlayerState => ({
  hp: 1000,
  attack: 2,
  focus: 0,
  consumables: [null, null, null],
  shield: 0,
  attackBoost: 0,
  attackBoostUntil: 0,
});

const withPlayerDefaults = (value?: Partial<PlayerState>): PlayerState => {
  const base = createDefaultPlayer();
  if (!value) return base;
  return {
    ...base,
    ...value,
    consumables: Array.isArray(value.consumables)
      ? (value.consumables as Array<ConsumableId | null>)
      : base.consumables,
  };
};

const pickRandomConsumable = () =>
  CONSUMABLE_POOL[Math.floor(Math.random() * CONSUMABLE_POOL.length)];

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
  const [showDebug, setShowDebug] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [revealedCards, setRevealedCards] = useState<string[]>([]);
  const [pendingLoot, setPendingLoot] = useState<ConsumableId | null>(null);
  const [lootLabel, setLootLabel] = useState<string | null>(null);
  const [lootReplaceIndex, setLootReplaceIndex] = useState<number | null>(null);
  const [freezeUntil, setFreezeUntil] = useState(0);
  const [player, setPlayer] = useState<PlayerState>(() => createDefaultPlayer());
  const [enemy, setEnemy] = useState<EnemyState>({
    hp: enemyStats.hp,
    attack: enemyStats.attack,
    ap: 0,
    apThreshold: enemyStats.apThreshold,
  });
  const [hydrated, setHydrated] = useState(false);

  const resolveKeyRef = useRef<string | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackBoostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lootLevelRef = useRef<number | null>(null);
  const selectedUpgradeRef = useRef<number | null>(null);
  const playerRef = useRef<PlayerState>(player);

  const flippedUnmatched = cards.filter(
    (card) => card.isFlipped && !card.isMatched,
  );
  const unlockedSet = useMemo(() => new Set(unlockedTerms), [unlockedTerms]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    selectedUpgradeRef.current = selectedUpgrade;
  }, [selectedUpgrade]);

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
      setPlayer(withPlayerDefaults(data.player));
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
    if (view !== "victory") return;
    if (lootLevelRef.current === level) return;
    lootLevelRef.current = level;
    const loot = pickRandomConsumable();
    setPendingLoot(loot);
    setLootLabel(CONSUMABLE_LABELS[loot]);
  }, [level, view]);

  useEffect(() => {
    if (view !== "game") {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = null;
      }
      if (attackBoostTimerRef.current) {
        clearTimeout(attackBoostTimerRef.current);
        attackBoostTimerRef.current = null;
      }
      setRevealedCards([]);
      setRevealActive(false);
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
        const boostActive = currentPlayer.attackBoostUntil > Date.now();
        const attackPower =
          currentPlayer.attack +
          (boostActive ? currentPlayer.attackBoost : 0);
        const damage = attackPower * (isCrit ? 2 : 1);
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
        if (Date.now() < freezeUntil) return prev;
        return {
          ...prev,
          ap: clamp(prev.ap + 1, 0, prev.apThreshold),
        };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [view, enemy.hp, freezeUntil]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;
    if (enemy.ap < enemy.apThreshold) return;

    setEnemy((prev) =>
      prev.ap >= prev.apThreshold ? { ...prev, ap: 0 } : prev,
    );
    setPlayer((prev) => {
      const reducedDamage = Math.max(0, enemy.attack - prev.shield);
      return {
        ...prev,
        hp: clamp(prev.hp - reducedDamage, 0, prev.hp),
        focus: clamp(prev.focus - 2, 0, 100),
        shield: 0,
      };
    });
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
    if (revealActive) return;
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
  const attackBoostActive = player.attackBoostUntil > Date.now();
  const effectiveAttack =
    player.attack + (attackBoostActive ? player.attackBoost : 0);

  const applyLevel = (nextLevel: number) => {
    const clampedLevel = clamp(nextLevel, 1, 10);
    const nextConfig = getLevelConfig(clampedLevel);
    const nextEnemyStats = ENEMY_STATS[clampedLevel] ?? ENEMY_STATS[1];

    setLevel(clampedLevel);
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
    setResumeView("game");
    setPendingLoot(null);
    setLootLabel(null);
    setLootReplaceIndex(null);
  };

  const toNumber = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

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
    setPlayer(createDefaultPlayer());
    setEnemy({
      hp: nextEnemyStats.hp,
      attack: nextEnemyStats.attack,
      ap: 0,
      apThreshold: nextEnemyStats.apThreshold,
    });
    setCards(buildDeck(vocab, nextConfig.pairs));
    setPendingLoot(null);
    setLootLabel(null);
    setLootReplaceIndex(null);
  };

  const handleResume = () => {
    setView(resumeView);
  };

  const handleNextLevel = () => {
    if (level >= 10) return;
    const nextLevel = Math.min(level + 1, 10);
    const nextConfig = getLevelConfig(nextLevel);
    const nextEnemyStats = ENEMY_STATS[nextLevel] ?? ENEMY_STATS[1];
    const chosenUpgrade = selectedUpgradeRef.current;

    if (chosenUpgrade === 0) {
      setPlayer((prev) => ({ ...prev, hp: prev.hp + 10 }));
    } else if (chosenUpgrade === 1) {
      setPlayer((prev) => ({ ...prev, attack: prev.attack + 2 }));
    }

    setLevel(nextLevel);
    setEnemy({
      hp: nextEnemyStats.hp,
      attack: nextEnemyStats.attack,
      ap: 0,
      apThreshold: nextEnemyStats.apThreshold,
    });
    setCards(buildDeck(vocab, nextConfig.pairs));
    setSelectedUpgrade(null);
    selectedUpgradeRef.current = null;
    setBusy(false);
    setView("game");
    if (chosenUpgrade === 2 && pendingLoot) {
      setPlayer((prev) => {
        const nextConsumables = [...prev.consumables];
        let targetIndex = nextConsumables[2] === null ? 2 : -1;
        if (targetIndex === -1) {
          targetIndex = nextConsumables.findIndex((slot) => slot === null);
        }
        if (targetIndex === -1 && lootReplaceIndex !== null) {
          targetIndex = lootReplaceIndex;
        }
        if (targetIndex !== -1) {
          nextConsumables[targetIndex] = pendingLoot;
        }
        return { ...prev, consumables: nextConsumables };
      });
    }
    setPendingLoot(null);
    setLootLabel(null);
    setLootReplaceIndex(null);
  };

  const triggerReveal = (count: number, durationMs: number) => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    const unmatchedPairs = Array.from(
      new Set(cards.filter((card) => !card.isMatched).map((card) => card.pairId)),
    );
    if (unmatchedPairs.length === 0) return;
    const pairsToReveal = Math.min(Math.ceil(count / 2), unmatchedPairs.length);
    const pairIds =
      pairsToReveal >= unmatchedPairs.length
        ? unmatchedPairs
        : shuffle(unmatchedPairs).slice(0, pairsToReveal);
    const revealIds = pairIds.flatMap((pairId) =>
      cards.filter((card) => card.pairId === pairId).map((card) => card.id),
    );
    setRevealedCards(revealIds);
    setRevealActive(true);
    revealTimerRef.current = setTimeout(() => {
      setRevealedCards([]);
      setRevealActive(false);
      revealTimerRef.current = null;
    }, durationMs);
  };

  const handleUseConsumable = (slotIndex: number) => {
    if (view !== "game") return;
    if (busy || revealActive) return;
    const item = player.consumables[slotIndex];
    if (!item) return;

    const consumeSlot = (updater?: (prev: PlayerState) => PlayerState) => {
      setPlayer((prev) => {
        const nextConsumables = [...prev.consumables];
        nextConsumables[slotIndex] = null;
        return updater ? updater({ ...prev, consumables: nextConsumables }) : { ...prev, consumables: nextConsumables };
      });
    };

    const now = Date.now();

    switch (item) {
      case "minor_reveal":
        triggerReveal(2, 5000);
        consumeSlot();
        break;
      case "major_reveal":
        triggerReveal(4, 5000);
        consumeSlot();
        break;
      case "cosmic_reveal":
        triggerReveal(cards.length, 3000);
        consumeSlot();
        break;
      case "freeze":
        if (freezeTimerRef.current) {
          clearTimeout(freezeTimerRef.current);
          freezeTimerRef.current = null;
        }
        setFreezeUntil(now + 6000);
        freezeTimerRef.current = setTimeout(() => {
          setFreezeUntil(0);
          freezeTimerRef.current = null;
        }, 6000);
        consumeSlot();
        break;
      case "obsidian_shield":
        consumeSlot((prev) => ({ ...prev, shield: 6 }));
        break;
      case "holyxaliber":
        if (attackBoostTimerRef.current) {
          clearTimeout(attackBoostTimerRef.current);
          attackBoostTimerRef.current = null;
        }
        consumeSlot((prev) => ({
          ...prev,
          attackBoost: 6,
          attackBoostUntil: now + 6000,
        }));
        attackBoostTimerRef.current = setTimeout(() => {
          setPlayer((prev) => ({
            ...prev,
            attackBoost: 0,
            attackBoostUntil: 0,
          }));
          attackBoostTimerRef.current = null;
        }, 6000);
        break;
      case "bandage":
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 5 }));
        break;
      case "med_kit":
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 10 }));
        break;
      case "holy_heal":
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 25 }));
        break;
      default:
        break;
    }
  };

  const handleReplaceConsumable = (slotIndex: number) => {
    setLootReplaceIndex(slotIndex);
  };

  const handleSelectUpgrade = (index: number) => {
    selectedUpgradeRef.current = index;
    setSelectedUpgrade(index);
    if (index !== 2) {
      setLootReplaceIndex(null);
      return;
    }
    setLootReplaceIndex(null);
  };

  const upgradeOptions = [
    "+10 HP",
    "+2 ATK",
    lootLabel ?? "Consumable Drop",
  ];
  const inventoryFull = player.consumables.every((slot) => slot !== null);
  const lootBlocked =
    selectedUpgrade === 2 &&
    pendingLoot !== null &&
    inventoryFull &&
    lootReplaceIndex === null;

  const gridColsClass = cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-4" : "grid-cols-6";
  const gridRowsClass = rows === 2 ? "grid-rows-2" : rows === 4 ? "grid-rows-4" : "grid-rows-6";
  const gridGapClass = cols === 3 ? "gap-4" : cols === 4 ? "gap-3" : "gap-2";
  const gridAspectClass =
    rows === 2
      ? cols === 3
        ? "aspect-[3/2]"
        : cols === 4
          ? "aspect-[2/1]"
          : "aspect-[3/1]"
      : "aspect-square";

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
                  onClick={() => handleSelectUpgrade(index)}
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

          {lootBlocked ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Inventory Full - Discard One
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Select a slot to replace with {pendingLoot ? CONSUMABLE_LABELS[pendingLoot] : "loot"}.
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {player.consumables.map((item, index) => (
                  <button
                    key={`discard-${index}`}
                    type="button"
                    onClick={() => handleReplaceConsumable(index)}
                    className={`rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      lootReplaceIndex === index
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200/80 bg-white text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {item ? CONSUMABLE_LABELS[item] : "Empty"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Next level unlocks a new enemy
            </div>
            <button
              type="button"
              onClick={handleNextLevel}
              disabled={selectedUpgrade === null || level >= 10 || lootBlocked}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                selectedUpgrade === null || level >= 10 || lootBlocked
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
    <div className="h-screen box-border flex flex-col p-4">
      <div className="flex flex-col flex-none">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Battle</h1>
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Level {level}
          </div>
        </div>

        <div className="mt-3 grid flex-1 min-h-0 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] md:p-6 flex flex-col">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Player
            </div>
            <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <div className="text-slate-500">HP</div>
                  <div className="text-2xl font-semibold">{player.hp}</div>
                </div>
                <div>
                  <div className="text-slate-500">ATK</div>
                  <div className="text-2xl font-semibold">
                    {effectiveAttack}
                  </div>
                  {attackBoostActive ? (
                    <div className="text-xs text-emerald-500">+{player.attackBoost} boost</div>
                  ) : null}
                </div>
                <div>
                  <div className="text-slate-500">Focus</div>
                  <div className="text-2xl font-semibold">{player.focus}</div>
                  <div className="text-xs text-slate-400">
                    Crit {critChance}%
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Items
                </div>
                <div className="flex flex-col gap-2">
                  {player.consumables.map((item, index) => (
                    <button
                      key={`slot-${index}`}
                      type="button"
                      onClick={() => handleUseConsumable(index)}
                      disabled={!item || busy || revealActive}
                      className={`flex h-10 items-center justify-center rounded-xl border border-dashed text-[10px] uppercase tracking-[0.2em] transition ${
                        item
                          ? "border-slate-200/80 bg-white text-slate-600 hover:border-amber-300"
                          : "border-slate-200/80 bg-slate-50/70 text-slate-400"
                      } ${!item || busy || revealActive ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {item ? CONSUMABLE_LABELS[item] : "Empty"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-center text-sm text-slate-400">
                Player art slot
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 text-right shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)] md:p-6 flex flex-col">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Enemy
            </div>
            <div className="mt-4 flex min-h-0 flex-1 items-stretch gap-4">
              <div className="flex-1 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-center text-sm text-slate-400">
                Enemy art slot
              </div>
              <div className="flex flex-col items-end gap-3 text-sm">
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
            </div>
          </div>
        </div>
      </div>

      <div className="h-[10vh] min-h-0 flex flex-col justify-center">
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

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className={`max-h-full max-w-full w-full ${gridAspectClass}`}>
          <div
            className={`grid h-full w-full ${gridColsClass} ${gridRowsClass} ${gridGapClass}`}
          >
            {cards.map((card) => {
              const isUnlockedTerm =
                card.face === "term" && unlockedSet.has(card.pairId);
              const isRevealed =
                card.isFlipped ||
                card.isMatched ||
                revealedCards.includes(card.id);
              return (
                <Card
                  key={card.id}
                  id={card.id}
                  text={card.text}
                  face={card.face}
                  isFlipped={isRevealed}
                  isMatched={card.isMatched}
                  isLocked={busy || revealActive}
                  onFlip={handleFlip}
                  className={`h-full w-full ${
                    isUnlockedTerm ? "ring-2 ring-emerald-400/70" : ""
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowDebug((prev) => !prev)}
        className="fixed bottom-4 right-4 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300"
      >
        {showDebug ? "Hide Debug" : "Show Debug"}
      </button>

      {showDebug ? (
        <div className="fixed bottom-16 right-4 w-[320px] rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)]">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Debug Tools
          </div>
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Level
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={level}
                  onChange={(event) =>
                    applyLevel(toNumber(event.target.value, level))
                  }
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
                <span className="text-xs text-slate-500">
                  Auto-resets enemy + deck
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Player Stats
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">HP</span>
                  <input
                    type="number"
                    value={player.hp}
                    onChange={(event) =>
                      setPlayer((prev) => ({
                        ...prev,
                        hp: toNumber(event.target.value, prev.hp),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">ATK</span>
                  <input
                    type="number"
                    value={player.attack}
                    onChange={(event) =>
                      setPlayer((prev) => ({
                        ...prev,
                        attack: toNumber(event.target.value, prev.attack),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Focus</span>
                  <input
                    type="number"
                    value={player.focus}
                    onChange={(event) =>
                      setPlayer((prev) => ({
                        ...prev,
                        focus: clamp(
                          toNumber(event.target.value, prev.focus),
                          0,
                          100,
                        ),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Consumables
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                {player.consumables.map((item, index) => (
                  <label key={`debug-slot-${index}`} className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Slot {index + 1}</span>
                    <select
                      value={item ?? ""}
                      onChange={(event) => {
                        const value = event.target.value as ConsumableId | "";
                        setPlayer((prev) => {
                          const nextConsumables = [...prev.consumables];
                          nextConsumables[index] = value === "" ? null : value;
                          return { ...prev, consumables: nextConsumables };
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="">Empty</option>
                      {CONSUMABLE_POOL.map((consumable) => (
                        <option key={consumable} value={consumable}>
                          {CONSUMABLE_LABELS[consumable]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPlayer((prev) => ({
                      ...prev,
                      consumables: [null, null, null],
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  Clear Slots
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayer((prev) => {
                      const nextConsumables = [...prev.consumables];
                      nextConsumables[2] = pickRandomConsumable();
                      return { ...prev, consumables: nextConsumables };
                    })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  Random Slot 3
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Enemy Stats
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">HP</span>
                  <input
                    type="number"
                    value={enemy.hp}
                    onChange={(event) =>
                      setEnemy((prev) => ({
                        ...prev,
                        hp: toNumber(event.target.value, prev.hp),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">ATK</span>
                  <input
                    type="number"
                    value={enemy.attack}
                    onChange={(event) =>
                      setEnemy((prev) => ({
                        ...prev,
                        attack: toNumber(event.target.value, prev.attack),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">AP</span>
                  <input
                    type="number"
                    value={enemy.ap}
                    onChange={(event) =>
                      setEnemy((prev) => ({
                        ...prev,
                        ap: toNumber(event.target.value, prev.ap),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">AP Thresh</span>
                  <input
                    type="number"
                    value={enemy.apThreshold}
                    onChange={(event) =>
                      setEnemy((prev) => ({
                        ...prev,
                        apThreshold: Math.max(
                          1,
                          toNumber(event.target.value, prev.apThreshold),
                        ),
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
