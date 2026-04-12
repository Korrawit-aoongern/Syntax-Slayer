"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import ApBar from "../components/game/ApBar";
import DebugPanel from "../components/game/DebugPanel";
import Encyclopedia from "../components/game/Encyclopedia";
import EnemyPanel from "../components/game/EnemyPanel";
import FinalVictoryScreen from "../components/game/FinalVictoryScreen";
import GameOverScreen from "../components/game/GameOverScreen";
import MainMenu from "../components/game/MainMenu";
import PlayerPanel from "../components/game/PlayerPanel";
import VictoryScreen from "../components/game/VictoryScreen";
import vocabData from "../data/vocab.json";
import { type BgmId } from "../data/audioConfig";
import {
  CONSUMABLE_LABELS,
  CONSUMABLE_POOL,
  ENDLESS_CONSUMABLE_POOL,
} from "../data/consumables";
import { ENEMY_SPRITE_CONFIG } from "../data/enemySprites";
import { ENCYCLOPEDIA_KEY, ENEMY_STATS, STORAGE_KEY } from "../data/gameConfig";
import type {
  ConsumableId,
  Category,
  EnemyState,
  GameCard,
  GameView,
  GameMode,
  PlayMode,
  EndlessStats,
  PlayerState,
  SessionState,
  TermFilter,
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
import { getCategoryRingClass } from "../utils/category";
import useAudioManager from "../utils/useAudioManager";

const vocab = vocabData as VocabItem[];

const buildEnemyState = (level: number, mode: GameMode): EnemyState => {
  const stats = ENEMY_STATS[level] ?? ENEMY_STATS[1];
  const attackMult = mode === "hard" ? 2 : 1;
  const apThresholdMult = mode === "easy" ? 10 : 1;
  return {
    hp: stats.hp,
    attack: Math.round(stats.attack * attackMult),
    ap: 0,
    apThreshold: Math.max(1, Math.round(stats.apThreshold * apThresholdMult)),
  };
};

export default function GamePage() {
  const [level, setLevel] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [resumeMode, setResumeMode] = useState<GameMode>("classic");
  const [playMode, setPlayMode] = useState<PlayMode>("standard");
  const [resumePlayMode, setResumePlayMode] =
    useState<PlayMode>("standard");
  const [termFilter, setTermFilter] = useState<TermFilter>("random");
  const [customCategories, setCustomCategories] = useState<Category[]>([
    "SE",
    "CPE",
    "CS",
    "IT",
    "IS",
  ]);
  const isEndless = playMode === "endless";
  const { rows, cols, pairs } = getLevelConfig(level);
  const modeConfig = useMemo(() => {
    return {
      apTickMs: isEndless ? 5000 : gameMode === "easy" ? 5000 : 3000,
      apThresholdMult: gameMode === "easy" ? 10 : 1,
      enemyAttackMult: gameMode === "hard" ? 2 : 1,
      mismatchDelayMs: gameMode === "hard" ? 1500 : 2500,
      ghostingEnabled: isEndless ? true : gameMode === "classic",
      allowToggle: isEndless ? false : gameMode === "easy",
      penaltyOnMismatch: isEndless ? false : gameMode !== "easy",
    };
  }, [gameMode, isEndless]);
  const filteredVocab = useMemo(() => {
    if (termFilter === "random") return vocab;
    if (termFilter === "custom") {
      const selected =
        customCategories.length > 0
          ? customCategories
          : (["SE"] as Category[]);
      return vocab.filter((item) => selected.includes(item.category));
    }
    return vocab.filter((item) => item.category === termFilter);
  }, [customCategories, termFilter]);
  const initialDeck = useMemo(
    () => buildDeck(filteredVocab, pairs),
    [filteredVocab, pairs],
  );
  const [cards, setCards] = useState<GameCard[]>(initialDeck);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<GameView>("mainmenu");
  const [resumeView, setResumeView] = useState<GameView>("game");
  const [selectedUpgrade, setSelectedUpgrade] = useState<number | null>(null);
  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [runUnlockedTerms, setRunUnlockedTerms] = useState<string[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [revealActive, setRevealActive] = useState(false);
  const [revealedCards, setRevealedCards] = useState<string[]>([]);
  const [pendingLoot, setPendingLoot] = useState<ConsumableId | null>(null);
  const [lootLabel, setLootLabel] = useState<string | null>(null);
  const [lootReplaceIndex, setLootReplaceIndex] = useState<number | null>(null);
  const [freezeUntil, setFreezeUntil] = useState(0);
  const [endlessStats, setEndlessStats] = useState<EndlessStats>({
    correct: 0,
    wrong: 0,
    streak: 0,
    maxStreak: 0,
  });
  const [player, setPlayer] = useState<PlayerState>(() => createDefaultPlayer());
  const [playerAttackTick, setPlayerAttackTick] = useState(0);
  const [playerHitTick, setPlayerHitTick] = useState(0);
  const [enemyAttackTick, setEnemyAttackTick] = useState(0);
  const [enemyHitTick, setEnemyHitTick] = useState(0);
  const [lockedCards, setLockedCards] = useState<string[]>([]);
  const [enemy, setEnemy] = useState<EnemyState>(() =>
    buildEnemyState(1, "classic"),
  );
  const [hydrated, setHydrated] = useState(false);
  const audio = useAudioManager();

  const resolveKeyRef = useRef<string | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackBoostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyAttackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyHitSfxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerHitFxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyAttackQueuedRef = useRef(false);
  const mismatchTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const endlessDropRef = useRef(0);
  const lootLevelRef = useRef<number | null>(null);
  const selectedUpgradeRef = useRef<number | null>(null);
  const playerRef = useRef<PlayerState>(player);
  const enemyRef = useRef<EnemyState>(enemy);
  const resolvingRef = useRef(false);
  const winPlayedRef = useRef(false);
  const losePlayedRef = useRef(false);
  const finalVictoryPlayedRef = useRef(false);
  const comboStreakRef = useRef(0);
  const freezeUntilRef = useRef(0);
  const flipTimesRef = useRef<number[]>([]);

  const lockedSet = useMemo(() => new Set(lockedCards), [lockedCards]);
  const flippedUnmatched = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.isFlipped && !card.isMatched && !lockedSet.has(card.id),
      ),
    [cards, lockedSet],
  );
  const flippedKey = useMemo(() => {
    if (flippedUnmatched.length !== 2) return "";
    return [...flippedUnmatched]
      .map((card) => card.id)
      .sort()
      .join("|");
  }, [flippedUnmatched]);
  const unlockedSet = useMemo(() => new Set(unlockedTerms), [unlockedTerms]);
  const runUnlockedSet = useMemo(
    () => new Set(runUnlockedTerms),
    [runUnlockedTerms],
  );
  const runUnlockedItems = useMemo(
    () => vocab.filter((item) => runUnlockedSet.has(item.id)),
    [runUnlockedSet],
  );

  const resetMismatchLocks = useCallback(() => {
    Object.values(mismatchTimersRef.current).forEach((timer) => {
      clearTimeout(timer);
    });
    mismatchTimersRef.current = {};
    setLockedCards([]);
  }, []);

  const performEnemyAttack = useCallback(() => {
    const dashConfig = ENEMY_SPRITE_CONFIG[level]?.dash;
    const hitSfxDelay =
      dashConfig?.soundDelayMs ?? dashConfig?.approachMs ?? 0;
    const hitFlashDelay =
      dashConfig?.flashDelayMs ??
      dashConfig?.soundDelayMs ??
      dashConfig?.approachMs ??
      0;
    if (enemyHitSfxTimerRef.current) {
      clearTimeout(enemyHitSfxTimerRef.current);
      enemyHitSfxTimerRef.current = null;
    }
    if (playerHitFxTimerRef.current) {
      clearTimeout(playerHitFxTimerRef.current);
      playerHitFxTimerRef.current = null;
    }
    if (hitSfxDelay > 0) {
      enemyHitSfxTimerRef.current = setTimeout(() => {
        audio.playSfx("damage");
        enemyHitSfxTimerRef.current = null;
      }, hitSfxDelay);
    } else {
      audio.playSfx("damage");
    }
    if (playerRef.current.shield > 0) {
      audio.playSfx("block");
    }
    setEnemyAttackTick((prev) => prev + 1);
    if (hitFlashDelay > 0) {
      playerHitFxTimerRef.current = setTimeout(() => {
        setPlayerHitTick((prev) => prev + 1);
        playerHitFxTimerRef.current = null;
      }, hitFlashDelay);
    } else {
      setPlayerHitTick((prev) => prev + 1);
    }

    setEnemy((prev) => ({ ...prev, ap: 0 }));
    if (playMode === "endless") return;
    setPlayer((prev) => {
      const reducedDamage = Math.max(
        0,
        Math.round(enemyRef.current.attack * (1 - prev.shield)),
      );
      return {
        ...prev,
        hp: clamp(prev.hp - reducedDamage, 0, prev.hp),
        focus: clamp(prev.focus - 2, 0, 100),
        shield: 0,
      };
    });
  }, [audio, level, playMode]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    enemyRef.current = enemy;
  }, [enemy]);

  useEffect(() => {
    freezeUntilRef.current = freezeUntil;
  }, [freezeUntil]);

  useEffect(() => {
    selectedUpgradeRef.current = selectedUpgrade;
  }, [selectedUpgrade]);

  useEffect(() => {
    try {
      const encyclopediaRaw = localStorage.getItem(ENCYCLOPEDIA_KEY);
      const encyclopediaTerms = (() => {
        if (!encyclopediaRaw) return null;
        const parsed = JSON.parse(encyclopediaRaw);
        return Array.isArray(parsed) ? parsed : null;
      })();

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setView("mainmenu");
        setUnlockedTerms(encyclopediaTerms ?? []);
        setRunUnlockedTerms([]);
        setHydrated(true);
        return;
      }
      const data = JSON.parse(raw) as Partial<SessionState>;
      const isCategory = (value: unknown): value is Category =>
        value === "SE" ||
        value === "CPE" ||
        value === "CS" ||
        value === "IT" ||
        value === "IS";
      const isTermFilter = (value: unknown): value is TermFilter =>
        value === "random" || value === "custom" || isCategory(value);
      const isGameMode = (value: unknown): value is GameMode =>
        value === "classic" || value === "easy" || value === "hard";
      const isPlayMode = (value: unknown): value is PlayMode =>
        value === "standard" || value === "endless";
      const storedCustom: Category[] = Array.isArray(data.customCategories)
        ? data.customCategories.filter(isCategory)
        : [];
      const defaultCustom: Category[] = ["SE", "CPE", "CS", "IT", "IS"];
      const nextCustom: Category[] =
        storedCustom.length > 0 ? storedCustom : defaultCustom;
      const storedPlayMode = isPlayMode(data.playMode)
        ? data.playMode
        : "standard";
      const loadedLevel =
        typeof data.level === "number" && data.level >= 1 ? data.level : 1;
      const effectiveLevel = storedPlayMode === "endless" ? 10 : loadedLevel;
      const { pairs: loadedPairs } = getLevelConfig(effectiveLevel);

      setLevel(effectiveLevel);
      const storedMode = isGameMode(data.gameMode) ? data.gameMode : "classic";
      setGameMode(storedMode);
      setResumeMode(storedMode);
      setPlayMode(storedPlayMode);
      setResumePlayMode(storedPlayMode);
      setTermFilter(isTermFilter(data.termFilter) ? data.termFilter : "random");
      setCustomCategories(nextCustom);
      const restoredView =
        data.view === "victory" || data.view === "mainmenu" ? data.view : "game";
      setResumeView(restoredView);
      setView("mainmenu");
      const loadedPlayer = withPlayerDefaults(data.player);
      const sanitizedPlayer =
        storedPlayMode === "endless"
          ? {
              ...loadedPlayer,
              consumables: loadedPlayer.consumables.map((item) =>
                item && ENDLESS_CONSUMABLE_POOL.includes(item) ? item : null,
              ),
            }
          : loadedPlayer;
      setPlayer(sanitizedPlayer);
      setEnemy(data.enemy ?? buildEnemyState(effectiveLevel, storedMode));
      const filterForDeck = isTermFilter(data.termFilter)
        ? data.termFilter
        : "random";
      const deckSource =
        filterForDeck === "random"
          ? vocab
          : filterForDeck === "custom"
            ? vocab.filter((item) => nextCustom.includes(item.category))
            : vocab.filter((item) => item.category === filterForDeck);
      setCards(
        Array.isArray(data.cards) && data.cards.length > 0
          ? data.cards
          : buildDeck(deckSource, loadedPairs),
      );
      setUnlockedTerms(
        encyclopediaTerms ??
          (Array.isArray(data.unlockedTerms) ? data.unlockedTerms : []),
      );
      setRunUnlockedTerms(
        Array.isArray(data.runUnlockedTerms) ? data.runUnlockedTerms : [],
      );
      setSelectedUpgrade(
        typeof data.selectedUpgrade === "number" ? data.selectedUpgrade : null,
      );
      const defaultEndless: EndlessStats = {
        correct: 0,
        wrong: 0,
        streak: 0,
        maxStreak: 0,
      };
      const restoredEndless =
        data.endlessStats &&
          typeof data.endlessStats.correct === "number" &&
          typeof data.endlessStats.wrong === "number" &&
          typeof data.endlessStats.streak === "number" &&
          typeof data.endlessStats.maxStreak === "number"
          ? data.endlessStats
          : defaultEndless;
      setEndlessStats(restoredEndless);
      endlessDropRef.current = Math.floor(restoredEndless.correct / 5) * 5;

      setHasSave(true);
      setHydrated(true);
    } catch {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasSave && view === "mainmenu") return;
    const persistedView =
      view === "mainmenu" ||
      view === "encyclopedia" ||
      view === "gameover" ||
      view === "finalvictory"
        ? resumeView
        : view;
    const payload: SessionState = {
      view: persistedView,
      level,
      player,
      enemy,
      cards,
      unlockedTerms,
      runUnlockedTerms,
      selectedUpgrade,
      termFilter,
      customCategories,
      gameMode,
      playMode,
      endlessStats,
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
    runUnlockedTerms,
    selectedUpgrade,
    termFilter,
    customCategories,
    gameMode,
    playMode,
    endlessStats,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ENCYCLOPEDIA_KEY, JSON.stringify(unlockedTerms));
  }, [hydrated, unlockedTerms]);

  useEffect(() => {
    if (
      view !== "mainmenu" &&
      view !== "encyclopedia" &&
      view !== "gameover" &&
      view !== "finalvictory"
    ) {
      setResumeView(view);
      setResumeMode(gameMode);
      setResumePlayMode(playMode);
    }
  }, [gameMode, playMode, view]);

  useEffect(() => {
    return () => {
      audio.stopAll();
    };
  }, [audio.stopAll]);

  useEffect(() => {
    if (view === "game") {
      winPlayedRef.current = false;
      losePlayedRef.current = false;
      finalVictoryPlayedRef.current = false;
    }
  }, [view, level]);

  useEffect(() => {
    if (view !== "finalvictory") return;
    audio.stopAll();
    if (!finalVictoryPlayedRef.current) {
      audio.unlock();
      audio.playSfx("boss_victory");
      finalVictoryPlayedRef.current = true;
    }
  }, [audio, view]);

  useEffect(() => {
    if (view === "finalvictory" || view === "gameover") {
      audio.stopAll();
      return;
    }
    const bgm: BgmId =
      view === "mainmenu" || view === "encyclopedia"
        ? "main_menu"
        : level <= 4
          ? "battle_1"
          : level <= 8
            ? "battle_2"
            : "battle_3";
    audio.setBgm(bgm);
  }, [audio, level, view]);

  useEffect(() => {
    if (view !== "victory") return;
    if (lootLevelRef.current !== level || pendingLoot === null) {
      lootLevelRef.current = level;
      const loot = pickRandomConsumable();
      setPendingLoot(loot);
      setLootLabel(CONSUMABLE_LABELS[loot]);
    }
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
      if (enemyAttackTimerRef.current) {
        clearTimeout(enemyAttackTimerRef.current);
        enemyAttackTimerRef.current = null;
      }
      if (enemyHitSfxTimerRef.current) {
        clearTimeout(enemyHitSfxTimerRef.current);
        enemyHitSfxTimerRef.current = null;
      }
      if (playerHitFxTimerRef.current) {
        clearTimeout(playerHitFxTimerRef.current);
        playerHitFxTimerRef.current = null;
      }
      resetMismatchLocks();
      enemyAttackQueuedRef.current = false;
      flipTimesRef.current = [];
      setPlayerHitTick(0);
      setRevealedCards([]);
      setRevealActive(false);
    }
  }, [resetMismatchLocks, view]);

  useEffect(() => {
    if (view !== "game") {
      resolveKeyRef.current = null;
      resolvingRef.current = false;
      return;
    }
    if (flippedKey === "") {
      resolveKeyRef.current = null;
      resolvingRef.current = false;
      return;
    }

    if (resolveKeyRef.current === flippedKey || resolvingRef.current) {
      return;
    }
    const [first, second] = flippedUnmatched;
    if (!first || !second) {
      resolveKeyRef.current = null;
      resolvingRef.current = false;
      return;
    }

    resolveKeyRef.current = flippedKey;
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }

    resolvingRef.current = true;
    setBusy(true);
    const isMatch = first.pairId === second.pairId;

    resolveTimerRef.current = setTimeout(() => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== first.id && card.id !== second.id) {
            return card;
          }
          if (isMatch) {
            return { ...card, isMatched: true, isFlipped: true };
          }
          return card;
        }),
      );

      if (isMatch) {
        audio.playSfx("match");
        comboStreakRef.current += 1;
        if (comboStreakRef.current >= 2) {
          audio.playSfx("combo");
        }
        audio.playSfx("attack");
        setPlayerAttackTick((prev) => prev + 1);
        setEnemyHitTick((prev) => prev + 1);

        if (isEndless) {
          setEnemy((prevEnemy) => ({
            ...prevEnemy,
            ap: clamp(prevEnemy.ap - 1, 0, prevEnemy.apThreshold),
          }));
          setEndlessStats((prevStats) => {
            const nextCorrect = prevStats.correct + 1;
            const nextStreak = prevStats.streak + 1;
            const nextMax = Math.max(prevStats.maxStreak, nextStreak);
            if (nextCorrect % 5 === 0 && nextCorrect !== endlessDropRef.current) {
              const pool = ENDLESS_CONSUMABLE_POOL;
              const drop =
                pool[Math.floor(Math.random() * pool.length)] ?? null;
              if (drop) {
                setPlayer((prevPlayer) => {
                  const nextConsumables = [...prevPlayer.consumables];
                  const emptyIndex = nextConsumables.findIndex(
                    (slot) => slot === null,
                  );
                  if (emptyIndex === -1) {
                    nextConsumables[0] = drop;
                  } else {
                    nextConsumables[emptyIndex] = drop;
                  }
                  return { ...prevPlayer, consumables: nextConsumables };
                });
              }
              endlessDropRef.current = nextCorrect;
            }
            return {
              correct: nextCorrect,
              wrong: prevStats.wrong,
              streak: nextStreak,
              maxStreak: nextMax,
            };
          });
        } else {
          const currentPlayer = playerRef.current;
          const critChance = clamp(currentPlayer.focus, 0, 100) / 100;
          const isCrit = Math.random() < critChance;
          if (isCrit) {
            audio.playSfx("crit");
          }
          const boostActive = currentPlayer.attackBoostUntil > Date.now();
          const attackPower = boostActive
            ? currentPlayer.attack * currentPlayer.attackBoost
            : currentPlayer.attack;
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
            return {
              ...prevEnemy,
              hp: nextHp,
              ap: clamp(prevEnemy.ap - 1, 0, prevEnemy.apThreshold),
            };
          });
        }

        setUnlockedTerms((prev) =>
          prev.includes(first.pairId) ? prev : [...prev, first.pairId],
        );
        setRunUnlockedTerms((prev) =>
          prev.includes(first.pairId) ? prev : [...prev, first.pairId],
        );
      } else {
        comboStreakRef.current = 0;
        audio.playSfx("mismatch");
        if (isEndless) {
          setEndlessStats((prevStats) => ({
            correct: prevStats.correct,
            wrong: prevStats.wrong + 1,
            streak: 0,
            maxStreak: prevStats.maxStreak,
          }));
          setEnemy((prevEnemy) => {
            if (Date.now() < freezeUntilRef.current) return prevEnemy;
            return {
              ...prevEnemy,
              ap: clamp(prevEnemy.ap + 1, 0, prevEnemy.apThreshold),
            };
          });
        } else if (modeConfig.penaltyOnMismatch) {
          setPlayer((prevPlayer) => ({ ...prevPlayer, focus: 0 }));
          setEnemy((prevEnemy) => {
            if (Date.now() < freezeUntilRef.current) return prevEnemy;
            return {
              ...prevEnemy,
              ap: clamp(prevEnemy.ap + 2, 0, prevEnemy.apThreshold),
            };
          });
        }

        const mismatchIds = [first.id, second.id];
        const mismatchKey = mismatchIds.slice().sort().join("|");
        if (mismatchTimersRef.current[mismatchKey]) {
          clearTimeout(mismatchTimersRef.current[mismatchKey]);
        }

        if (modeConfig.ghostingEnabled) {
          setLockedCards((prev) => {
            const next = new Set(prev);
            mismatchIds.forEach((id) => next.add(id));
            return Array.from(next);
          });
          mismatchTimersRef.current[mismatchKey] = setTimeout(() => {
            setCards((prev) =>
              prev.map((card) => {
                if (mismatchIds.includes(card.id) && !card.isMatched) {
                  return { ...card, isFlipped: false };
                }
                return card;
              }),
            );
            setLockedCards((prev) =>
              prev.filter((id) => !mismatchIds.includes(id)),
            );
            delete mismatchTimersRef.current[mismatchKey];
          }, modeConfig.mismatchDelayMs);
        } else if (gameMode === "hard") {
          setCards((prev) =>
            prev.map((card) => {
              if (mismatchIds.includes(card.id) && !card.isMatched) {
                return { ...card, isFlipped: false };
              }
              return card;
            }),
          );
        }
      }

      setBusy(false);
      resolvingRef.current = false;
      const keepResolveKey = !isMatch && gameMode === "easy";
      if (!keepResolveKey) {
        resolveKeyRef.current = null;
      }
      resolveTimerRef.current = null;
    }, 700);

    return () => {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
        resolveKeyRef.current = null;
        resolvingRef.current = false;
      }
    };
  }, [audio, flippedKey, gameMode, isEndless, modeConfig, view]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleTick = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (enemyRef.current.hp <= 0) return;
        if (enemyAttackQueuedRef.current) {
          scheduleTick(modeConfig.apTickMs);
          return;
        }
        if (Date.now() < freezeUntilRef.current) {
          const remaining = Math.max(
            0,
            freezeUntilRef.current - Date.now(),
          );
          scheduleTick(remaining + modeConfig.apTickMs);
          return;
        }
        setEnemy((prev) => ({
          ...prev,
          ap: clamp(prev.ap + 1, 0, prev.apThreshold),
        }));
        scheduleTick(modeConfig.apTickMs);
      }, delay);
    };

    scheduleTick(modeConfig.apTickMs);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [enemy.hp, modeConfig.apTickMs, view]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;
    if (enemy.ap < enemy.apThreshold) return;

    if (enemyAttackQueuedRef.current) return;
    enemyAttackQueuedRef.current = true;
    setEnemy((prev) =>
      prev.ap >= prev.apThreshold ? { ...prev, ap: prev.apThreshold } : prev,
    );

    if (enemyAttackTimerRef.current) {
      clearTimeout(enemyAttackTimerRef.current);
    }
    enemyAttackTimerRef.current = setTimeout(() => {
      performEnemyAttack();
      enemyAttackQueuedRef.current = false;
      enemyAttackTimerRef.current = null;
    }, 350);
  }, [enemy.ap, enemy.apThreshold, enemy.hp, performEnemyAttack, view]);

  useEffect(() => {
    if (view !== "game") return;
    if (enemy.hp <= 0) return;
    if (cards.length === 0) return;
    if (!cards.every((card) => card.isMatched)) return;

    setBusy(true);
    const timer = setTimeout(() => {
      setCards(buildDeck(filteredVocab, pairs));
      resetMismatchLocks();
      flipTimesRef.current = [];
      setBusy(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [cards, pairs, view, enemy.hp, filteredVocab]);

  useEffect(() => {
    if (isEndless) return;
    if (view !== "game") return;
    if (enemy.hp > 0) return;
    if (!winPlayedRef.current && level < 10) {
      audio.playSfx("win");
      winPlayedRef.current = true;
    }
    setView(level >= 10 ? "finalvictory" : "victory");
  }, [enemy.hp, isEndless, level, view]);

  useEffect(() => {
    if (isEndless) return;
    if (view !== "game") return;
    if (player.hp > 0) return;
    if (!losePlayedRef.current) {
      audio.stopAll();
      audio.playSfx("lose");
      losePlayedRef.current = true;
    }
    setView("gameover");
  }, [isEndless, player.hp, view]);

  const handleFlip = (id: string) => {
    if (view !== "game") return;
    if (busy) return;
    if (revealActive) return;
    const targetCard = cards.find((card) => card.id === id);
    if (!targetCard || targetCard.isMatched) return;
    if (modeConfig.allowToggle && targetCard.isFlipped) {
      audio.unlock();
      audio.playSfx("flip");
      setCards((prev) =>
        prev.map((card) =>
          card.id === id && !card.isMatched
            ? { ...card, isFlipped: false }
            : card,
        ),
      );
      return;
    }
    if (flippedUnmatched.length >= 2) return;
    if (lockedSet.has(id)) return;
    if (targetCard.isFlipped) return;

    audio.unlock();
    audio.playSfx("flip");
    setCards((prev) =>
      prev.map((card) =>
        card.id === id && !card.isFlipped && !card.isMatched
          ? { ...card, isFlipped: true }
          : card,
      ),
    );

    if (gameMode === "hard") {
      // Anti-spam penalty removed per request.
      flipTimesRef.current = [];
    }
  };

  const apPercent =
    enemy.apThreshold === 0 ? 0 : (enemy.ap / enemy.apThreshold) * 100;
  const endlessTotal = endlessStats.correct + endlessStats.wrong;
  const endlessAccuracy =
    endlessTotal > 0 ? Math.round((endlessStats.correct / endlessTotal) * 100) : 0;
  const critChance = clamp(player.focus, 0, 100);
  const attackBoostActive = player.attackBoostUntil > Date.now();
  const effectiveAttack = attackBoostActive
    ? player.attack * player.attackBoost
    : player.attack;

  const applyLevel = (nextLevel: number) => {
    const clampedLevel = clamp(nextLevel, 1, 10);
    const nextConfig = getLevelConfig(clampedLevel);

    setLevel(clampedLevel);
    setEnemy(buildEnemyState(clampedLevel, gameMode));
    setCards(buildDeck(filteredVocab, nextConfig.pairs));
    resetMismatchLocks();
    flipTimesRef.current = [];
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
      if (isEndless) {
        const pool = ENDLESS_CONSUMABLE_POOL;
        nextConsumables[2] =
          pool[Math.floor(Math.random() * pool.length)] ?? null;
      } else {
        nextConsumables[2] = pickRandomConsumable();
      }
      return { ...prev, consumables: nextConsumables };
    });
  };

  const handleUnlockAllTerms = () => {
    const allIds = vocab.map((item) => item.id);
    setUnlockedTerms(allIds);
    setRunUnlockedTerms(allIds);
  };

  const handleResetTerms = () => {
    setUnlockedTerms([]);
    setRunUnlockedTerms([]);
  };

  const handleNewGame = () => {
    audio.unlock();
    audio.playSfx("click");
    localStorage.removeItem(STORAGE_KEY);
    if (playMode === "endless") {
      startEndlessRun();
      return;
    }
    const nextConfig = getLevelConfig(1);

    setHasSave(true);
    setLevel(1);
    setPlayMode("standard");
    setView("game");
    setResumeView("game");
    setResumeMode(gameMode);
    setResumePlayMode("standard");
    setSelectedUpgrade(null);
    setRunUnlockedTerms([]);
    setBusy(false);
    setPlayer(createDefaultPlayer());
    setEnemy(buildEnemyState(1, gameMode));
    setCards(buildDeck(filteredVocab, nextConfig.pairs));
    resetMismatchLocks();
    flipTimesRef.current = [];
    setPendingLoot(null);
    setLootLabel(null);
    setLootReplaceIndex(null);
    setEndlessStats({ correct: 0, wrong: 0, streak: 0, maxStreak: 0 });
    endlessDropRef.current = 0;
  };

  const startEndlessRun = () => {
    audio.unlock();
    localStorage.removeItem(STORAGE_KEY);
    const nextConfig = getLevelConfig(10);
    const endlessPlayer = createDefaultPlayer();

    setHasSave(true);
    setLevel(10);
    setPlayMode("endless");
    setGameMode("classic");
    setResumeMode("classic");
    setResumePlayMode("endless");
    setView("game");
    setResumeView("game");
    setSelectedUpgrade(null);
    setRunUnlockedTerms([]);
    setBusy(false);
    setPlayer({ ...endlessPlayer, consumables: [null, null, null] });
    setEnemy(buildEnemyState(10, "classic"));
    setCards(buildDeck(filteredVocab, nextConfig.pairs));
    resetMismatchLocks();
    flipTimesRef.current = [];
    setPendingLoot(null);
    setLootLabel(null);
    setLootReplaceIndex(null);
    setEndlessStats({ correct: 0, wrong: 0, streak: 0, maxStreak: 0 });
    endlessDropRef.current = 0;
  };

  const handleResume = () => {
    audio.unlock();
    audio.playSfx("click");
    setGameMode(resumeMode);
    setPlayMode(resumePlayMode);
    setView(resumeView);
  };

  const handleOpenEncyclopedia = () => {
    audio.unlock();
    audio.playSfx("click");
    setView("encyclopedia");
  };

  const handleSettingsClick = () => {
    audio.unlock();
    audio.playSfx("click");
  };

  const handleFilterClick = () => {
    audio.unlock();
    audio.playSfx("click");
  };

  const handleModeClick = () => {
    audio.unlock();
    audio.playSfx("click");
  };

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setPlayMode("standard");
  };

  const handleSelectPlayMode = (mode: PlayMode) => {
    setPlayMode(mode);
    if (mode === "endless") {
      setGameMode("classic");
    }
  };

  const handleCloseEncyclopedia = () => {
    audio.unlock();
    audio.playSfx("click");
    setView("mainmenu");
  };

  const handleBackToMenu = () => {
    audio.unlock();
    audio.playSfx("click");
    setView("mainmenu");
  };

  const handleFinishEndless = () => {
    audio.unlock();
    audio.playSfx("click");
    localStorage.removeItem(STORAGE_KEY);
    setHasSave(false);
    setView("finalvictory");
    endlessDropRef.current = 0;
  };

  const handleResetProgression = () => {
    audio.unlock();
    audio.playSfx("click");
    localStorage.removeItem(ENCYCLOPEDIA_KEY);
    setUnlockedTerms([]);
  };

  const handleNextLevel = () => {
    if (isEndless) return;
    if (level >= 10) return;
    audio.unlock();
    const nextLevel = Math.min(level + 1, 10);
    const nextConfig = getLevelConfig(nextLevel);
    const chosenUpgrade = selectedUpgradeRef.current;
    const autoHpGain = gameMode === "hard" ? 0 : 10;
    const upgradeValues =
      level <= 4
        ? { hp: 15, atk: 2 }
        : level <= 8
          ? { hp: 25, atk: 4 }
          : { hp: 50, atk: 6 };

    setPlayer((prev) => {
      const hpGain = autoHpGain + (chosenUpgrade === 0 ? upgradeValues.hp : 0);
      const atkGain = chosenUpgrade === 1 ? upgradeValues.atk : 0;
      return {
        ...prev,
        hp: prev.hp + hpGain,
        attack: prev.attack + atkGain,
      };
    });

    setLevel(nextLevel);
    setEnemy(buildEnemyState(nextLevel, gameMode));
    setCards(buildDeck(filteredVocab, nextConfig.pairs));
    resetMismatchLocks();
    flipTimesRef.current = [];
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
    if (isEndless && !ENDLESS_CONSUMABLE_POOL.includes(item)) return;
    audio.unlock();

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
        audio.playSfx("reveal");
        triggerReveal(2, 3000);
        consumeSlot();
        break;
      case "major_reveal":
        audio.playSfx("reveal");
        triggerReveal(4, 5000);
        consumeSlot();
        break;
      case "cosmic_reveal":
        audio.playSfx("reveal");
        triggerReveal(cards.length, 5000);
        consumeSlot();
        break;
      case "freeze":
        audio.playSfx("freeze");
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
        audio.playSfx("block");
        consumeSlot((prev) => ({ ...prev, shield: 0.5 }));
        break;
      case "holyxaliber":
        audio.playSfx("holyxaliber");
        if (attackBoostTimerRef.current) {
          clearTimeout(attackBoostTimerRef.current);
          attackBoostTimerRef.current = null;
        }
        consumeSlot((prev) => ({
          ...prev,
          attackBoost: 2,
          attackBoostUntil: now + 6000,
        }));
        attackBoostTimerRef.current = setTimeout(() => {
          setPlayer((prev) => ({
            ...prev,
            attackBoost: 1,
            attackBoostUntil: 0,
          }));
          attackBoostTimerRef.current = null;
        }, 6000);
        break;
      case "bandage":
        audio.playSfx("heal");
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 10 }));
        break;
      case "med_kit":
        audio.playSfx("heal");
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 20 }));
        break;
      case "holy_heal":
        audio.playSfx("heal");
        consumeSlot((prev) => ({ ...prev, hp: prev.hp + 50 }));
        break;
      default:
        break;
    }
  };

  const handleReplaceConsumable = (slotIndex: number) => {
    audio.unlock();
    audio.playSfx("click");
    setLootReplaceIndex(slotIndex);
  };

  const handleSelectUpgrade = (index: number) => {
    audio.unlock();
    audio.playSfx("click");
    selectedUpgradeRef.current = index;
    setSelectedUpgrade(index);
    if (index !== 2) {
      setLootReplaceIndex(null);
      return;
    }
    if (!pendingLoot) {
      const loot = pickRandomConsumable();
      setPendingLoot(loot);
      setLootLabel(CONSUMABLE_LABELS[loot]);
    }
    setLootReplaceIndex(null);
  };

  const autoHpGain = gameMode === "hard" ? 0 : 10;
  const upgradeValues =
    level <= 4
      ? { hp: 15, atk: 2 }
      : level <= 8
        ? { hp: 25, atk: 4 }
        : { hp: 50, atk: 6 };
  const upgradeOptions = [
    `+${upgradeValues.hp} HP`,
    `+${upgradeValues.atk} ATK`,
    lootLabel ?? "Consumable Drop",
  ];
  const inventoryFull = player.consumables.every((slot) => slot !== null);
  const lootBlocked =
    selectedUpgrade === 2 &&
    pendingLoot !== null &&
    inventoryFull &&
    lootReplaceIndex === null;

  const handleToggleMusic = (value: boolean) => {
    audio.unlock();
    audio.setMusicMuted(value);
  };

  const handleToggleSfx = (value: boolean) => {
    audio.unlock();
    audio.setSfxMuted(value);
  };

  const handleMusicVolume = (value: number) => {
    audio.unlock();
    audio.setMusicVolume(value);
  };

  const handleSfxVolume = (value: number) => {
    audio.unlock();
    audio.setSfxVolume(value);
  };

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
        autoHpGain={autoHpGain}
        upgradeOptions={upgradeOptions}
        selectedUpgrade={selectedUpgrade}
        onSelectUpgrade={handleSelectUpgrade}
        onNextLevel={handleNextLevel}
        nextDisabled={selectedUpgrade === null || level >= 10 || lootBlocked}
        lootBlocked={lootBlocked}
        pendingLootLabel={pendingLoot ? CONSUMABLE_LABELS[pendingLoot] : lootLabel}
        pendingLootId={pendingLoot}
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
        onOpenEncyclopedia={handleOpenEncyclopedia}
        onSettingsClick={handleSettingsClick}
        onFilterClick={handleFilterClick}
        onModeClick={handleModeClick}
        playMode={playMode}
        onSelectPlayMode={handleSelectPlayMode}
        gameMode={gameMode}
        onSelectMode={handleSelectMode}
        termFilter={termFilter}
        customCategories={customCategories}
        onSelectFilter={setTermFilter}
        onChangeCustomCategories={setCustomCategories}
        musicMuted={audio.musicMuted}
        sfxMuted={audio.sfxMuted}
        musicVolume={audio.musicVolume}
        sfxVolume={audio.sfxVolume}
        onToggleMusic={handleToggleMusic}
        onToggleSfx={handleToggleSfx}
        onChangeMusicVolume={handleMusicVolume}
        onChangeSfxVolume={handleSfxVolume}
      />
    );
  }

  if (view === "encyclopedia") {
    return (
      <Encyclopedia
        vocab={vocab}
        unlockedTerms={unlockedTerms}
        onBack={handleCloseEncyclopedia}
        onResetProgression={handleResetProgression}
      />
    );
  }

  if (view === "gameover") {
    return (
      <GameOverScreen
        onMainMenu={handleBackToMenu}
        onNewGame={handleNewGame}
      />
    );
  }

  if (view === "finalvictory") {
    return (
      <FinalVictoryScreen
        unlockedItems={runUnlockedItems}
        stats={
          isEndless
            ? {
                correct: endlessStats.correct,
                wrong: endlessStats.wrong,
                maxStreak: endlessStats.maxStreak,
                accuracy: endlessAccuracy,
              }
            : undefined
        }
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return (
    <div className="relative h-screen box-border flex flex-col p-4 overflow-hidden text-[var(--sw-text)]">
      <div className="flex flex-col flex-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToMenu}
              className="rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
            >
              Menu
            </button>
            {isEndless ? (
              <button
                onClick={handleFinishEndless}
                className="rounded-full px-6 py-2 text-sm font-semibold sw-button-secondary"
              >
                Finish
              </button>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold sw-title">Battle</h1>
          <div className="text-xs uppercase tracking-[0.25em] sw-muted">
            {isEndless ? "Endless" : `Level ${level}`}
          </div>
        </div>

        <div className="mt-3 grid flex-1 min-h-0 gap-4 lg:grid-cols-2">
          <PlayerPanel
            player={player}
            critChance={critChance}
            effectiveAttack={effectiveAttack}
            attackBoostActive={attackBoostActive}
            attackSignal={playerAttackTick}
            hitSignal={playerHitTick}
            onUseConsumable={handleUseConsumable}
            consumableLabels={CONSUMABLE_LABELS}
            disableConsumables={busy || revealActive}
            isEndless={isEndless}
            endlessStats={{
              correct: endlessStats.correct,
              wrong: endlessStats.wrong,
              maxStreak: endlessStats.maxStreak,
              accuracy: endlessAccuracy,
            }}
          />
          <EnemyPanel
            enemy={enemy}
            level={level}
            attackSignal={enemyAttackTick}
            hitSignal={enemyHitTick}
            isEndless={isEndless}
          />
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
              const hintRing = isUnlockedTerm
                ? getCategoryRingClass(card.category)
                : "";
              const mismatchClass =
                modeConfig.ghostingEnabled && lockedSet.has(card.id)
                  ? "mismatch-lock"
                  : "";
              return (
                <Card
                  key={card.id}
                  id={card.id}
                  text={card.text}
                  face={card.face}
                  category={card.isMatched ? card.category : null}
                  isFlipped={isRevealed}
                  isMatched={card.isMatched}
                  isLocked={busy || revealActive || lockedSet.has(card.id)}
                  onFlip={handleFlip}
                  className={`h-full w-full ${isUnlockedTerm ? `ring-2 ${hintRing}` : ""} ${mismatchClass}`}
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
        onUnlockAllTerms={handleUnlockAllTerms}
        onResetTerms={handleResetTerms}
        consumablePool={CONSUMABLE_POOL}
        consumableLabels={CONSUMABLE_LABELS}
      />

    </div>
  );
}
