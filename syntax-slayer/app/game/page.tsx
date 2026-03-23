"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import ApBar from "../components/game/ApBar";
import DebugPanel from "../components/game/DebugPanel";
import EnemyPanel from "../components/game/EnemyPanel";
import MainMenu from "../components/game/MainMenu";
import PlayerPanel from "../components/game/PlayerPanel";
import VictoryScreen from "../components/game/VictoryScreen";
import vocabData from "../data/vocab.json";
import { CONSUMABLE_LABELS, CONSUMABLE_POOL } from "../data/consumables";
import { ENEMY_STATS, STORAGE_KEY } from "../data/gameConfig";
import type {
  ConsumableId,
  EnemyState,
  GameCard,
  GameView,
  PlayerState,
  SessionState,
  VocabItem,
} from "../types/game";
import {
  buildDeck,
  clamp,
  createDefaultPlayer,
  getLevelConfig,
  pickRandomConsumable,
  shuffle,
  withPlayerDefaults,
} from "../utils/game";

const vocab = vocabData as VocabItem[];

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

  const handleDebugLevelChange = (value: number) => {
    applyLevel(toNumber(String(value), level));
  };

  const handleSetPlayerStat = (
    key: "hp" | "attack" | "focus",
    value: number,
  ) => {
    setPlayer((prev) => {
      if (key === "focus") {
        return { ...prev, focus: clamp(value, 0, 100) };
      }
      return { ...prev, [key]: value } as PlayerState;
    });
  };

  const handleSetEnemyStat = (
    key: "hp" | "attack" | "ap" | "apThreshold",
    value: number,
  ) => {
    setEnemy((prev) => {
      if (key === "apThreshold") {
        return { ...prev, apThreshold: Math.max(1, value) };
      }
      return { ...prev, [key]: value } as EnemyState;
    });
  };

  const handleSetConsumable = (
    index: number,
    value: ConsumableId | null,
  ) => {
    setPlayer((prev) => {
      const nextConsumables = [...prev.consumables];
      nextConsumables[index] = value;
      return { ...prev, consumables: nextConsumables };
    });
  };

  const handleClearConsumables = () => {
    setPlayer((prev) => ({ ...prev, consumables: [null, null, null] }));
  };

  const handleRandomSlot3 = () => {
    setPlayer((prev) => {
      const nextConsumables = [...prev.consumables];
      nextConsumables[2] = pickRandomConsumable();
      return { ...prev, consumables: nextConsumables };
    });
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
      <VictoryScreen
        level={level}
        upgradeOptions={upgradeOptions}
        selectedUpgrade={selectedUpgrade}
        onSelectUpgrade={handleSelectUpgrade}
        onNextLevel={handleNextLevel}
        nextDisabled={selectedUpgrade === null || level >= 10 || lootBlocked}
        lootBlocked={lootBlocked}
        pendingLootLabel={pendingLoot ? CONSUMABLE_LABELS[pendingLoot] : lootLabel}
        consumables={player.consumables}
        consumableLabels={CONSUMABLE_LABELS}
        onSelectDiscard={handleReplaceConsumable}
        lootReplaceIndex={lootReplaceIndex}
      />
    );
  }

  if (view === "mainmenu") {
    return (
      <MainMenu
        hasSave={hasSave}
        onResume={handleResume}
        onNewGame={handleNewGame}
      />
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
          <PlayerPanel
            player={player}
            critChance={critChance}
            effectiveAttack={effectiveAttack}
            attackBoostActive={attackBoostActive}
            onUseConsumable={handleUseConsumable}
            consumableLabels={CONSUMABLE_LABELS}
            disableConsumables={busy || revealActive}
          />
          <EnemyPanel enemy={enemy} />
        </div>
      </div>

      <ApBar apPercent={apPercent} level={level} rows={rows} cols={cols} pairs={pairs} />

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

      <DebugPanel
        show={showDebug}
        onToggle={() => setShowDebug((prev) => !prev)}
        level={level}
        onLevelChange={handleDebugLevelChange}
        player={player}
        enemy={enemy}
        onSetPlayerStat={handleSetPlayerStat}
        onSetEnemyStat={handleSetEnemyStat}
        onSetConsumable={handleSetConsumable}
        onClearConsumables={handleClearConsumables}
        onRandomSlot3={handleRandomSlot3}
        consumablePool={CONSUMABLE_POOL}
        consumableLabels={CONSUMABLE_LABELS}
      />
    </div>
  );
}
