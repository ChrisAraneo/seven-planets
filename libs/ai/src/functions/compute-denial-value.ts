import type { Player, PoolType } from '@seven-planets/game';
import {
  INFLUENCE_CARDS,
  isBuildingType,
  isInfluenceType,
  isResourceType,
} from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeAggression } from './compute-aggression';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import { getRivalGoalBuilding } from './get-rival-goal-building';
import { hasBuilding } from './has-building';
import { isSingularityReadyFor } from './is-singularity-ready-for';

const computeRivalGain = (rival: Player, poolType: PoolType): number =>
  match(poolType)
    .when(isBuildingType, (buildingType) =>
      match(buildingType === 'SINGULARITY' && isSingularityReadyFor(rival))
        .with(true, () => 5)
        .otherwise(() =>
          match(getRivalGoalBuilding(rival)?.id === buildingType)
            .with(true, () => 2.5)
            .otherwise(() => 0),
        ),
    )
    .when(isInfluenceType, (influenceType) =>
      match(rival.influence >= INFLUENCE_CARDS[influenceType].cost)
        .with(false, () => 0)
        .otherwise(() =>
          match(influenceType)
            .with('COUP', () => 6)
            .otherwise(() => 1.5),
        ),
    )
    .with('ATTACK', () =>
      match(
        !rival.hasPacifistStatus &&
          hasBuilding(rival, 'SILO') &&
          computeAggression(rival) >= getAiState().W.willNeutral,
      )
        .with(true, () => 1.4)
        .otherwise(() => 0),
    )
    .when(isResourceType, (resourceType) =>
      match(getRivalGoalBuilding(rival))
        .with(nullish, () => 0)
        .otherwise((goal) =>
          match(
            (goal.cost[resourceType] || 0) > (rival.hand[resourceType] || 0),
          )
            .with(true, () => 0.7)
            .otherwise(() => 0),
        ),
    )
    .otherwise(() => 0);

export const computeDenialValue = (
  player: Player,
  poolType: PoolType,
): number =>
  chain(computeAverageStrength())
    .thru((averageStrength) =>
      getAlivePlayers().reduce(
        (worstValue, rival) =>
          match(rival.id === player.id)
            .with(true, () => worstValue)
            .otherwise(() =>
              Math.max(
                worstValue,
                computeRivalGain(rival, poolType) *
                  Math.min(
                    2,
                    Math.max(
                      0.3,
                      computePlayerStrength(rival) /
                        Math.max(1, averageStrength),
                    ),
                  ),
              ),
            ),
        0,
      ),
    )
    .value();
