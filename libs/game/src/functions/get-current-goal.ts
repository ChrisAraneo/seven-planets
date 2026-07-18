import { match } from 'ts-pattern';

import { getSingularityReadyPlanet } from '../functions/get-singularity-ready-planet';
import type { BuildingType } from '../interfaces/building-type';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { nonNullable } from '../utils/p';
import { computeBuildingCost } from './compute-building-cost';
import { getBuildingLevel } from './get-building-level';
import { getNextBuildGoal } from './get-next-build-goal';

export interface BuildGoal {
  id: BuildingType;
  planet: Planet;
  cost: Cost;
}

export const getCurrentGoal = (
  state: GameState,
  player: Player,
): BuildGoal | null =>
  match(getSingularityReadyPlanet(state, player))
    .with(
      nonNullable,
      (readyPl): BuildGoal => ({
        id: 'SINGULARITY',
        planet: readyPl,
        cost: computeBuildingCost(
          'SINGULARITY',
          getBuildingLevel(readyPl, 'SINGULARITY') + 1,
        ),
      }),
    )
    .otherwise(() => getNextBuildGoal(state, player));
