import { getAiState } from '../state';
import { CARDS, INFLUENCE_CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import type {
  BuildingType,
  InfluenceType,
  Player,
  PoolType,
} from '@seven-planets/game';

import { aggression } from './aggression';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { avgStrength } from './avg-strength';
import { hasB } from './has-b';
import { playerStrength } from './player-strength';
import { rivalGoalBuilding } from './rival-goal-building';
import { isSingularityReadyFor } from './is-singularity-ready-for';

export function denialValue(player: Player, poolType: PoolType): number {
  const aiState = getAiState();
  const avg = avgStrength();
  let worst = 0;
  const def = CARDS[poolType];
  for (const eachPlayer of getAlivePlayers()) {
    if (eachPlayer.id === player.id) {
      continue;
    }
    const winner = Math.min(
      2,
      Math.max(0.3, playerStrength(eachPlayer) / Math.max(1, avg)),
    );
    let gain = 0;
    if (def.building) {
      if (poolType === 'SINGULARITY' && isSingularityReadyFor(eachPlayer)) {
        gain = 5;
      } else if (
        rivalGoalBuilding(eachPlayer)?.id === (poolType as BuildingType)
      ) {
        gain = 2.5;
      }
    } else if (def.influenceCard) {
      if (
        eachPlayer.influence >= INFLUENCE_CARDS[poolType as InfluenceType]?.cost
      ) {
        gain = poolType === 'COUP' ? 6 : 1.5;
      }
    } else if (poolType === 'ATTACK') {
      if (
        !eachPlayer.hasPacifistStatus &&
        hasB(eachPlayer, 'SILO') &&
        aggression(eachPlayer) >= aiState.W.willNeutral
      ) {
        gain = 1.4;
      }
    } else if (RESOURCE_TYPES.includes(poolType as never)) {
      const goal = rivalGoalBuilding(eachPlayer);
      if (
        goal &&
        (goal.cost[poolType] || 0) > (eachPlayer.hand[poolType] || 0)
      ) {
        gain = 0.7;
      }
    }
    worst = Math.max(worst, gain * winner);
  }
  return worst;
}
