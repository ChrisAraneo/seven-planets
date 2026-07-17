import type { Player, PoolType } from '@seven-planets/game';
import {
  INFLUENCE_CARDS,
  isBuildingType,
  isInfluenceType,
  isResourceType,
} from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { computeAggression } from './compute-aggression';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import { getRivalGoalBuilding } from './get-rival-goal-building';
import { hasBuilding } from './has-building';
import { isSingularityReadyFor } from './is-singularity-ready-for';

export function computeDenialValue(player: Player, poolType: PoolType): number {
  const averageStrength = computeAverageStrength();
  let worstValue = 0;
  for (const rival of getAlivePlayers()) {
    if (rival.id !== player.id) {
      const strengthFactor = Math.min(
        2,
        Math.max(
          0.3,
          computePlayerStrength(rival) / Math.max(1, averageStrength),
        ),
      );
      worstValue = Math.max(
        worstValue,
        computeRivalGain(rival, poolType) * strengthFactor,
      );
    }
  }
  return worstValue;
}

function computeRivalGain(rival: Player, poolType: PoolType): number {
  if (isBuildingType(poolType)) {
    if (poolType === 'SINGULARITY' && isSingularityReadyFor(rival)) {
      return 5;
    }
    return getRivalGoalBuilding(rival)?.id === poolType ? 2.5 : 0;
  }
  if (isInfluenceType(poolType)) {
    return rival.influence >= INFLUENCE_CARDS[poolType].cost
      ? poolType === 'COUP'
        ? 6
        : 1.5
      : 0;
  }
  if (poolType === 'ATTACK') {
    return !rival.hasPacifistStatus &&
      hasBuilding(rival, 'SILO') &&
      computeAggression(rival) >= getAiState().W.willNeutral
      ? 1.4
      : 0;
  }
  if (isResourceType(poolType)) {
    const goal = getRivalGoalBuilding(rival);
    return goal && (goal.cost[poolType] || 0) > (rival.hand[poolType] || 0)
      ? 0.7
      : 0;
  }
  return 0;
}
