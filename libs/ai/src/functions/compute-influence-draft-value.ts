import type { InfluenceType, Player } from '@seven-planets/game';
import { INFLUENCE_CARDS } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import { getBestCoupTarget } from './get-best-coup-target';
import { getSkipTarget } from './get-skip-target';
import type { Plan } from './plan-types';

export const computeInfluenceDraftValue = (
  player: Player,
  influenceType: InfluenceType,
  plan: Plan,
): number => {
  const { cost } = INFLUENCE_CARDS[influenceType];
  const starCost =
    cost * (plan.kind === 'COUP_BANK' && influenceType !== 'COUP' ? 1.2 : 0.35);
  switch (influenceType) {
    case 'COUP': {
      const coupTarget = getBestCoupTarget(player);
      if (coupTarget && coupTarget.value >= getAiState().W.coupValueFloor) {
        return 12 - ((player.hand.COUP || 0) > 0 ? 6 : 0);
      }
      return finishValue(player, influenceType, -2, starCost);
    }
    case 'STEAL_ACTION': {
      return finishValue(
        player,
        influenceType,
        canLootActionCard(player) ? 1.5 : -2,
        starCost,
      );
    }
    case 'PEACE': {
      return finishValue(
        player,
        influenceType,
        1 + plan.threat * 0.4,
        starCost,
      );
    }
    default: {
      return finishSkipValue(player, influenceType, starCost);
    }
  }
};

const finishValue = (
  player: Player,
  influenceType: InfluenceType,
  value: number,
  starCost: number,
): number =>
  value - ((player.hand[influenceType] || 0) > 0 ? 1.5 : 0) - starCost;

const finishSkipValue = (
  player: Player,
  influenceType: InfluenceType,
  starCost: number,
): number => {
  const target = getSkipTarget(player, influenceType);
  if (!target) {
    return -2;
  }
  const averageStrength = computeAverageStrength();
  const value =
    1 + (computePlayerStrength(target) / Math.max(1, averageStrength)) * 1.5;
  return finishValue(player, influenceType, value, starCost);
};

const canLootActionCard = (player: Player): boolean =>
  getAlivePlayers().some(
    (rival) =>
      rival.id !== player.id &&
      (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as const).some(
        (cardType) => (rival.hand[cardType] || 0) > 0,
      ),
  );
