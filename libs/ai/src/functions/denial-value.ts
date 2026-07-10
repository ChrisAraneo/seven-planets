import { getAiState } from '../state';
import {
  CARDS,
  INFLUENCE_CARDS,
  RESOURCE_TYPES,
} from '@seven-planets/game';
import type {
  BuildingType,
  InfluenceType,
  Player,
  PoolType,
} from '@seven-planets/game';

import { aggression } from './aggression';
import { alive } from './alive';
import { avgStrength } from './avg-strength';
import { hasB } from './has-b';
import { playerStrength } from './player-strength';
import { rivalGoalBuilding } from './rival-goal-building';
import { isSingularityReadyFor } from './is-singularity-ready-for';

export function denialValue(p: Player, t: PoolType): number {
  const aiState = getAiState();
  const avg = avgStrength();
  let worst = 0;
  const def = CARDS[t];
  for (const r of alive()) {
    if (r.id === p.id) {
      continue;
    }
    const w = Math.min(2, Math.max(0.3, playerStrength(r) / Math.max(1, avg)));
    let gain = 0;
    if (def.building) {
      if (t === 'SINGULARITY' && isSingularityReadyFor(r)) {
        gain = 5;
      } else if (rivalGoalBuilding(r)?.id === (t as BuildingType)) {
        gain = 2.5;
      }
    } else if (def.influenceCard) {
      if (r.influence >= INFLUENCE_CARDS[t as InfluenceType]?.cost) {
        gain = t === 'COUP' ? 6 : 1.5;
      }
    } else if (t === 'ATTACK') {
      if (
        !r.pacifistStatus &&
        hasB(r, 'SILO') &&
        aggression(r) >= aiState.W.willNeutral
      ) {
        gain = 1.4;
      }
    } else if (RESOURCE_TYPES.includes(t as never)) {
      const goal = rivalGoalBuilding(r);
      if (goal && (goal.cost[t] || 0) > (r.hand[t] || 0)) {
        gain = 0.7;
      }
    }
    worst = Math.max(worst, gain * w);
  }
  return worst;
}
