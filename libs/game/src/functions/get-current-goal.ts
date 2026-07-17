import { match, P } from 'ts-pattern';

import { getSingularityReadyPlanet } from '../functions/get-singularity-ready-planet';
import type { BuildingType } from '../interfaces/building-type';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { computeBuildingCost } from './compute-building-cost';
import { getNextBuildGoal } from './get-next-build-goal';

const { nonNullable } = P;

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
          (readyPl.buildings.SINGULARITY || 0) + 1,
        ),
      }),
    )
    .otherwise(() => getNextBuildGoal(state, player));
