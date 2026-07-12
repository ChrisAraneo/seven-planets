import { getAiState } from '../state';
import { INFLUENCE_CARDS } from '@seven-planets/game';
import type { InfluenceType, Player } from '@seven-planets/game';

import { alive } from './alive';
import { bestCoupTarget } from './best-coup-target';
import type { Plan } from './plan-types';
import { playerStrength } from './player-strength';
import { skipTarget } from './skip-target';

export function influenceDraftValue(
  player: Player,
  influenceType: InfluenceType,
  plan: Plan,
): number {
  const aiState = getAiState();
  const { cost } = INFLUENCE_CARDS[influenceType];
  const starCost =
    cost * (plan.kind === 'COUP_BANK' && influenceType !== 'COUP' ? 1.2 : 0.35);
  let eachValue = 0;
  switch (influenceType) {
    case 'COUP': {
      const tgt = bestCoupTarget(player);
      if (tgt && tgt.value >= aiState.W.coupValueFloor) {
        return 12 - ((player.hand.COUP || 0) > 0 ? 6 : 0);
      }
      eachValue = -2;
      break;
    }
    case 'STEAL_ACTION': {
      const loot = alive().some(
        (player) =>
          player.id !== player.id &&
          (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as const).some(
            (first) => (player.hand[first] || 0) > 0,
          ),
      );
      eachValue = loot ? 1.5 : -2;
      break;
    }
    case 'PEACE': {
      eachValue = 1 + plan.threat * 0.4;
      break;
    }
    default: {
      const target = skipTarget(player, influenceType);
      if (!target) {
        return -2;
      }
      const allStr = alive().map((player) => playerStrength(player));
      const avgStr =
        allStr.reduce((first, building) => first + building, 0) /
        (allStr.length || 1);
      eachValue = 1 + (playerStrength(target) / Math.max(1, avgStr)) * 1.5;
    }
  }
  if ((player.hand[influenceType] || 0) > 0) {
    eachValue -= 1.5;
  }
  return eachValue - starCost;
}
