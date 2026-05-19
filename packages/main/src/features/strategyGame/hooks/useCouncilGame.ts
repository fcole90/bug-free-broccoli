import { useCallback, useMemo, useState } from 'react';
import {
  councilEvents,
  councillorProfiles,
  initialGameStats,
} from '../constants';
import type {
  ChoiceResolution,
  CouncilChoice,
  CouncilGameState,
  CouncillorId,
  GameStats,
  StatDelta,
  StatLevel,
} from '../types';

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

export const useCouncilGame = () => {
  const [gameState, setGameState] = useState<CouncilGameState>(() =>
    createInitialGameState(),
  );

  const currentEvent = councilEvents[gameState.currentEventIndex];
  const currentCouncillor = councillorProfiles[currentEvent.councillorId];

  const startCouncil = useCallback(() => {
    setGameState({ ...createInitialGameState(), phase: 'event' });
  }, []);

  const resetCouncil = useCallback(() => {
    setGameState(createInitialGameState());
  }, []);

  const selectChoice = useCallback((choice: CouncilChoice) => {
    setGameState((previousState) => {
      const event = councilEvents[previousState.currentEventIndex];
      const nextStats = applyChoiceToStats(previousState.stats, choice);
      const earnedSigil = choice.awardsSigil ? event.councillorId : undefined;
      const resolution: ChoiceResolution = {
        event,
        choice,
        previousStats: previousState.stats,
        nextStats,
        earnedSigil,
      };

      return {
        ...previousState,
        phase: 'result',
        stats: nextStats,
        earnedSigils: addEarnedSigil(previousState.earnedSigils, earnedSigil),
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
