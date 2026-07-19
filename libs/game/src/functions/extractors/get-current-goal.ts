import { match } from 'ts-pattern';

import type { BuildGoal } from '../../interfaces/build-goal';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { nonNullable } from '../../utils/p';
import { computeBuildingCost } from '../compute-building-cost';
import { getBuildingLevel } from './get-building-level';
import { getNextBuildGoal } from './get-next-build-goal';
import { getSingularityReadyPlanet } from './get-singularity-ready-planet';

export const getCurrentGoal = (
  state: GameState,
  player: Player,
): BuildGoal | null =>
  match(getSingularityReadyPlanet(state, player))
    .with(
      nonNullable,
      (readyPlanet): BuildGoal => ({
        id: 'SINGULARITY',
        planet: readyPlanet,
        cost: computeBuildingCost(
          'SINGULARITY',
          getBuildingLevel(readyPlanet, 'SINGULARITY') + 1,
        ),
      }),
    )
    .otherwise(() => getNextBuildGoal(state, player));
