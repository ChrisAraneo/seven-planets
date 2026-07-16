import { getAiState } from '../state';
import { CARDS, INFLUENCE_CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import type {
  BuildingType,
  InfluenceType,
  Player,
  PoolType,
} from '@seven-planets/game';

import { computeAggression } from './compute-aggression';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeAverageStrength } from './compute-average-strength';
import { hasBuilding } from './has-building';
import { computePlayerStrength } from './compute-player-strength';
import { getRivalGoalBuilding } from './get-rival-goal-building';
import { isSingularityReadyFor } from './is-singularity-ready-for';

export function computeDenialValue(player: Player, poolType: PoolType): number {
  const aiState = getAiState();
  const averageStrength = computeAverageStrength();
  let worstValue = 0;
  const cardDefinition = CARDS[poolType];
  for (const rival of getAlivePlayers()) {
    if (rival.id === player.id) {
      continue;
    }
    const strengthFactor = Math.min(
      2,
      Math.max(
        0.3,
        computePlayerStrength(rival) / Math.max(1, averageStrength),
      ),
    );
    let gain = 0;
    if (cardDefinition.building) {
      if (poolType === 'SINGULARITY' && isSingularityReadyFor(rival)) {
        gain = 5;
      } else if (
        getRivalGoalBuilding(rival)?.id === (poolType as BuildingType)
      ) {
        gain = 2.5;
      }
    } else if (cardDefinition.influenceCard) {
      if (rival.influence >= INFLUENCE_CARDS[poolType as InfluenceType]?.cost) {
        gain = poolType === 'COUP' ? 6 : 1.5;
      }
    } else if (poolType === 'ATTACK') {
      if (
        !rival.hasPacifistStatus &&
        hasBuilding(rival, 'SILO') &&
        computeAggression(rival) >= aiState.W.willNeutral
      ) {
        gain = 1.4;
      }
    } else if (RESOURCE_TYPES.includes(poolType as never)) {
      const goal = getRivalGoalBuilding(rival);
      if (goal && (goal.cost[poolType] || 0) > (rival.hand[poolType] || 0)) {
        gain = 0.7;
      }
    }
    worstValue = Math.max(worstValue, gain * strengthFactor);
  }
  return worstValue;
}
