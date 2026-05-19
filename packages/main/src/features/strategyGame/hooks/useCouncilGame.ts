import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  councilGameStorageKey,
  councilEvents,
  councillorOrder,
  councillorProfiles,
  initialGameStats,
} from '../constants';
import type {
  ChoiceResolution,
  CouncilChoice,
  CouncilGameState,
  CouncillorId,
  EndingTier,
  GamePhase,
  GameStats,
  StatDelta,
  StatLevel,
} from '../types';

interface PersistedChoiceResolution {
  eventIndex: number;
  choiceId: string;
  previousStats: GameStats;
  nextStats: GameStats;
}

interface PersistedCouncilGameState {
  version: 2;
  phase: GamePhase;
  stats: GameStats;
  earnedSigils: CouncillorId[];
  history: PersistedChoiceResolution[];
  currentEventIndex: number;
  endingTier?: EndingTier;
}

const persistedStateVersion = 2;
const gamePhases: readonly GamePhase[] = ['intro', 'event', 'result', 'ending'];
const endingTiers: readonly EndingTier[] = [
  'dynastic-triumph',
  'noble-chaos',
  'last-resort',
];

const createInitialGameState = (): CouncilGameState => ({
  phase: 'intro',
  stats: initialGameStats,
  earnedSigils: [],
  history: [],
  currentEventIndex: 0,
});

const clampStatLevel = (value: number): StatLevel => {
  if (value <= 1) {
    return 1;
  }

  if (value >= 3) {
    return 3;
  }

  return 2;
};

const applyStatDelta = (value: StatLevel, delta: StatDelta | undefined) =>
  clampStatLevel(value + (delta ?? 0));

const applyChoiceToStats = (
  stats: GameStats,
  choice: CouncilChoice,
): GameStats => ({
  stress: applyStatDelta(stats.stress, choice.statDeltas.stress),
  gold: applyStatDelta(stats.gold, choice.statDeltas.gold),
  harmony: applyStatDelta(stats.harmony, choice.statDeltas.harmony),
  suspicion: applyStatDelta(stats.suspicion, choice.statDeltas.suspicion),
});

const addEarnedSigil = (
  earnedSigils: readonly CouncillorId[],
  nextSigil: CouncillorId | undefined,
) => {
  if (nextSigil == null || earnedSigils.includes(nextSigil)) {
    return earnedSigils;
  }

  return [...earnedSigils, nextSigil];
};

const createChoiceResolution = (
  eventIndex: number,
  choice: CouncilChoice,
  previousStats: GameStats,
  nextStats: GameStats,
): ChoiceResolution => {
  const event = councilEvents[eventIndex];
  const earnedSigil = choice.awardsSigil ? event.councillorId : undefined;

  return {
    event,
    choice,
    previousStats,
    nextStats,
    earnedSigil,
  };
};

const countWorstStats = (stats: GameStats) => {
  const worstValues = [
    stats.stress === 3,
    stats.gold === 1,
    stats.harmony === 1,
    stats.suspicion === 3,
  ];

  return worstValues.filter(Boolean).length;
};

const calculateEndingTier = (
  stats: GameStats,
  earnedSigils: readonly CouncillorId[],
): EndingTier => {
  if (earnedSigils.length <= 1 || countWorstStats(stats) >= 2) {
    return 'last-resort';
  }

  if (earnedSigils.length >= 4 && stats.stress !== 3) {
    return 'dynastic-triumph';
  }

  return 'noble-chaos';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null && !Array.isArray(value);

const isStatLevel = (value: unknown): value is StatLevel =>
  value === 1 || value === 2 || value === 3;

const isGamePhase = (value: unknown): value is GamePhase =>
  typeof value === 'string' && gamePhases.includes(value as GamePhase);

const isEndingTier = (value: unknown): value is EndingTier =>
  typeof value === 'string' && endingTiers.includes(value as EndingTier);

const isCouncillorId = (value: unknown): value is CouncillorId => {
  const councillorIds: readonly string[] = councillorOrder;

  return typeof value === 'string' && councillorIds.includes(value);
};

const parseGameStats = (value: unknown): GameStats | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { stress, gold, harmony, suspicion } = value;

  if (
    !isStatLevel(stress) ||
    !isStatLevel(gold) ||
    !isStatLevel(harmony) ||
    !isStatLevel(suspicion)
  ) {
    return undefined;
  }

  return { stress, gold, harmony, suspicion };
};

const parseEarnedSigils = (
  value: unknown,
): readonly CouncillorId[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const earnedSigils: CouncillorId[] = [];

  for (const item of value) {
    if (!isCouncillorId(item)) {
      return undefined;
    }

    if (!earnedSigils.includes(item)) {
      earnedSigils.push(item);
    }
  }

  return earnedSigils;
};

const parseCurrentEventIndex = (value: unknown): number | undefined => {
  if (
    !Number.isInteger(value) ||
    typeof value !== 'number' ||
    value < 0 ||
    value >= councilEvents.length
  ) {
    return undefined;
  }

  return value;
};

const parsePersistedChoiceResolution = (
  value: unknown,
): ChoiceResolution | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const eventIndex = parseCurrentEventIndex(value.eventIndex);
  const choiceId = value.choiceId;
  const previousStats = parseGameStats(value.previousStats);
  const nextStats = parseGameStats(value.nextStats);

  if (
    eventIndex == null ||
    typeof choiceId !== 'string' ||
    previousStats == null ||
    nextStats == null
  ) {
    return undefined;
  }

  const event = councilEvents[eventIndex];
  const choice = event.choices.find(
    (eventChoice) => eventChoice.id === choiceId,
  );

  if (choice == null) {
    return undefined;
  }

  return createChoiceResolution(eventIndex, choice, previousStats, nextStats);
};

const parseHistory = (
  value: unknown,
): readonly ChoiceResolution[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const history: ChoiceResolution[] = [];

  for (const item of value) {
    const resolution = parsePersistedChoiceResolution(item);

    if (resolution == null) {
      return undefined;
    }

    history.push(resolution);
  }

  return history;
};

const parsePersistedGameState = (
  value: unknown,
): CouncilGameState | undefined => {
  if (!isRecord(value) || value.version !== persistedStateVersion) {
    return undefined;
  }

  const phase = isGamePhase(value.phase) ? value.phase : undefined;
  const stats = parseGameStats(value.stats);
  const earnedSigils = parseEarnedSigils(value.earnedSigils);
  const history = parseHistory(value.history);
  const currentEventIndex = parseCurrentEventIndex(value.currentEventIndex);

  if (
    phase == null ||
    stats == null ||
    earnedSigils == null ||
    history == null ||
    currentEventIndex == null
  ) {
    return undefined;
  }

  const endingTier =
    isEndingTier(value.endingTier) ?
      value.endingTier
    : calculateEndingTier(stats, earnedSigils);

  if (phase === 'ending') {
    return {
      phase,
      stats,
      earnedSigils,
      history,
      currentEventIndex,
      endingTier,
    };
  }

  if (phase !== 'result') {
    return {
      phase,
      stats,
      earnedSigils,
      history,
      currentEventIndex,
    };
  }

  const latestResolution = history.findLast(
    (resolution) => resolution.event.id === councilEvents[currentEventIndex].id,
  );

  if (latestResolution == null) {
    return undefined;
  }

  return {
    phase,
    stats,
    earnedSigils,
    history,
    currentEventIndex,
    latestResolution,
  };
};

const serializeResolution = (
  resolution: ChoiceResolution,
): PersistedChoiceResolution => ({
  eventIndex: councilEvents.findIndex(
    (event) => event.id === resolution.event.id,
  ),
  choiceId: resolution.choice.id,
  previousStats: resolution.previousStats,
  nextStats: resolution.nextStats,
});

const serializeGameState = (
  gameState: CouncilGameState,
): PersistedCouncilGameState => {
  const persistedState: PersistedCouncilGameState = {
    version: persistedStateVersion,
    phase: gameState.phase,
    stats: gameState.stats,
    earnedSigils: [...gameState.earnedSigils],
    history: gameState.history.map(serializeResolution),
    currentEventIndex: gameState.currentEventIndex,
  };

  if (gameState.endingTier != null) {
    persistedState.endingTier = gameState.endingTier;
  }

  return persistedState;
};

const readStoredGameState = (): CouncilGameState | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const storedState = window.localStorage.getItem(councilGameStorageKey);

    if (storedState == null) {
      return undefined;
    }

    return parsePersistedGameState(JSON.parse(storedState) as unknown);
  } catch {
    return undefined;
  }
};

const writeStoredGameState = (gameState: CouncilGameState) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      councilGameStorageKey,
      JSON.stringify(serializeGameState(gameState)),
    );
  } catch {
    // Ignore storage failures so private browsing or full storage cannot break play.
  }
};

const clearStoredGameState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(councilGameStorageKey);
  } catch {
    // Ignore storage failures so the menu can still reset the local game state.
  }
};

export const useCouncilGame = () => {
  const [gameState, setGameState] = useState<CouncilGameState>(() =>
    createInitialGameState(),
  );
  const [storedGameState, setStoredGameState] = useState<
    CouncilGameState | undefined
  >();
  const [storageReady, setStorageReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const currentEvent = councilEvents[gameState.currentEventIndex];
  const currentCouncillor = councillorProfiles[currentEvent.councillorId];

  useEffect(() => {
    const storedState = readStoredGameState();

    if (storedState != null) {
      setStoredGameState(storedState);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || !gameStarted) {
      return;
    }

    writeStoredGameState(gameState);
    setStoredGameState(gameState);
  }, [gameStarted, gameState, storageReady]);

  const beginNewGame = useCallback(() => {
    setGameState(createInitialGameState());
    setGameStarted(true);
  }, []);

  const loadCouncil = useCallback(() => {
    if (storedGameState == null) {
      return;
    }

    setGameState(storedGameState);
    setGameStarted(true);
  }, [storedGameState]);

  const startCouncil = useCallback(() => {
    setGameStarted(true);
    setGameState({ ...createInitialGameState(), phase: 'event' });
  }, []);

  const resetCouncil = useCallback(() => {
    setGameState(createInitialGameState());
    setStoredGameState(undefined);
    setGameStarted(false);
    clearStoredGameState();
  }, []);

  const continueCouncil = useCallback(() => {
    setGameState((previousState) => {
      const nextEventIndex = previousState.currentEventIndex + 1;

      if (nextEventIndex < councilEvents.length) {
        return {
          ...previousState,
          phase: 'event',
          currentEventIndex: nextEventIndex,
          latestResolution: undefined,
        };
      }

      return {
        ...previousState,
        phase: 'ending',
        endingTier: calculateEndingTier(
          previousState.stats,
          previousState.earnedSigils,
        ),
        latestResolution: undefined,
      };
    });
  }, []);

  const selectChoice = useCallback((choice: CouncilChoice) => {
    setGameState((previousState) => {
      const nextStats = applyChoiceToStats(previousState.stats, choice);
      const resolution = createChoiceResolution(
        previousState.currentEventIndex,
        choice,
        previousState.stats,
        nextStats,
      );

      return {
        ...previousState,
        phase: 'result',
        stats: nextStats,
        earnedSigils: addEarnedSigil(
          previousState.earnedSigils,
          resolution.earnedSigil,
        ),
        history: [...previousState.history, resolution],
        latestResolution: resolution,
      };
    });
  }, []);

  const earnedSigilSet = useMemo(
    () => new Set<CouncillorId>(gameState.earnedSigils),
    [gameState.earnedSigils],
  );

  return {
    gameState,
    currentEvent,
    currentCouncillor,
    earnedSigilSet,
    gameStarted,
    hasSavedGame: storedGameState != null,
    savedGameState: storedGameState,
    storageReady,
    beginNewGame,
    loadCouncil,
    startCouncil,
    resetCouncil,
    continueCouncil,
    selectChoice,
  };
};
