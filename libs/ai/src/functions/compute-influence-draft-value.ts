import { getAiState } from '../state';
import { INFLUENCE_CARDS } from '@seven-planets/game';
import type { InfluenceType, Player } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeAverageStrength } from './compute-average-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import type { Plan } from './plan-types';
import { computePlayerStrength } from './compute-player-strength';
import { getSkipTarget } from './get-skip-target';

export function computeInfluenceDraftValue(
  player: Player,
  influenceType: InfluenceType,
  plan: Plan,
): number {
  const aiState = getAiState();
  const { cost } = INFLUENCE_CARDS[influenceType];
  const starCost =
    cost * (plan.kind === 'COUP_BANK' && influenceType !== 'COUP' ? 1.2 : 0.35);
  let value = 0;
  switch (influenceType) {
    case 'COUP': {
      const coupTarget = getBestCoupTarget(player);
      if (coupTarget && coupTarget.value >= aiState.W.coupValueFloor) {
        return 12 - ((player.hand.COUP || 0) > 0 ? 6 : 0);
      }
      value = -2;
      break;
    }
    case 'STEAL_ACTION': {
      const canLoot = getAlivePlayers().some(
        (rival) =>
          rival.id !== player.id &&
          (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as const).some(
            (cardType) => (rival.hand[cardType] || 0) > 0,
          ),
      );
      value = canLoot ? 1.5 : -2;
      break;
    }
    case 'PEACE': {
      value = 1 + plan.threat * 0.4;
      break;
    }
    default: {
      const target = getSkipTarget(player, influenceType);
      if (!target) {
        return -2;
      }
      const averageStrength = computeAverageStrength();
      value =
        1 +
        (computePlayerStrength(target) / Math.max(1, averageStrength)) * 1.5;
    }
  }
  if ((player.hand[influenceType] || 0) > 0) {
    value -= 1.5;
  }
  return value - starCost;
}
