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
  GamePhase,
  GameStats,
  StatDelta,
  StatLevel,
} from '../types';

interface PersistedCouncilGameState {
  version: 1;
  phase: GamePhase;
  stats: GameStats;
  earnedSigils: CouncillorId[];
  currentEventIndex: number;
  latestChoiceId?: string;
  previousStats?: GameStats;
}

const persistedStateVersion = 1;
const gamePhases: readonly GamePhase[] = ['intro', 'event', 'result'];

const createInitialGameState = (): CouncilGameState => ({
  phase: 'intro',
  stats: initialGameStats,
  earnedSigils: [],
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null && !Array.isArray(value);

const isStatLevel = (value: unknown): value is StatLevel =>
  value === 1 || value === 2 || value === 3;

const isGamePhase = (value: unknown): value is GamePhase =>
  typeof value === 'string' && gamePhases.includes(value as GamePhase);

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

const parsePersistedGameState = (
  value: unknown,
): CouncilGameState | undefined => {
  if (!isRecord(value) || value.version !== persistedStateVersion) {
    return undefined;
  }

  const phase = isGamePhase(value.phase) ? value.phase : undefined;
  const stats = parseGameStats(value.stats);
  const earnedSigils = parseEarnedSigils(value.earnedSigils);
  const currentEventIndex = parseCurrentEventIndex(value.currentEventIndex);

  if (
    phase == null ||
    stats == null ||
    earnedSigils == null ||
    currentEventIndex == null
  ) {
    return undefined;
  }

  if (phase !== 'result') {
    return {
      phase,
      stats,
      earnedSigils,
      currentEventIndex,
    };
  }

  const latestChoiceId = value.latestChoiceId;
  const previousStats = parseGameStats(value.previousStats);

  if (typeof latestChoiceId !== 'string' || previousStats == null) {
    return undefined;
  }

  const event = councilEvents[currentEventIndex];
  const choice = event.choices.find(
    (eventChoice) => eventChoice.id === latestChoiceId,
  );

  if (choice == null) {
    return undefined;
  }

  return {
    phase,
    stats,
    earnedSigils,
    currentEventIndex,
    latestResolution: createChoiceResolution(
      currentEventIndex,
      choice,
      previousStats,
      stats,
    ),
  };
};

const serializeGameState = (
  gameState: CouncilGameState,
): PersistedCouncilGameState => {
  const persistedState: PersistedCouncilGameState = {
    version: persistedStateVersion,
    phase: gameState.phase,
    stats: gameState.stats,
    earnedSigils: [...gameState.earnedSigils],
    currentEventIndex: gameState.currentEventIndex,
  };

  if (gameState.latestResolution != null) {
    persistedState.latestChoiceId = gameState.latestResolution.choice.id;
    persistedState.previousStats = gameState.latestResolution.previousStats;
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

export const useCouncilGame = () => {
  const [gameState, setGameState] = useState<CouncilGameState>(() =>
    createInitialGameState(),
  );
  const [storageReady, setStorageReady] = useState(false);

  const currentEvent = councilEvents[gameState.currentEventIndex];
  const currentCouncillor = councillorProfiles[currentEvent.councillorId];

  useEffect(() => {
    const storedState = readStoredGameState();

    if (storedState != null) {
      setGameState(storedState);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    writeStoredGameState(gameState);
  }, [gameState, storageReady]);

  const startCouncil = useCallback(() => {
    setGameState({ ...createInitialGameState(), phase: 'event' });
  }, []);

  const resetCouncil = useCallback(() => {
    setGameState(createInitialGameState());
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
    startCouncil,
    resetCouncil,
    selectChoice,
  };
};
