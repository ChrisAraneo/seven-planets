import { match } from 'ts-pattern';

import { ADVANCED_FROM_TURN, BUILD_ORDER } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import { isSingularityInPlay } from './is-singularity-in-play';

export const getEligibleBuildings = (state: GameState): BuildingType[] =>
  BUILD_ORDER.filter((buildingType) =>
    match(buildingType)
      .with('LAB', () => state.turn >= ADVANCED_FROM_TURN)
      .with('SINGULARITY', () => isSingularityInPlay(state))
      .otherwise(() => true),
  );
