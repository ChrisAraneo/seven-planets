import { getAiState } from '../state';
import { INFLUENCE_CARDS } from '@seven-planets/game';
import type { InfluenceType, Player } from '@seven-planets/game';

import { alive } from './alive';
import { bestCoupTarget } from './best-coup-target';
import type { Plan } from './plan-types';
import { playerStrength } from './player-strength';
import { skipTarget } from './skip-target';

export function influenceDraftValue(
  p: Player,
  t: InfluenceType,
  plan: Plan,
): number {
  const aiState = getAiState();
  const { cost } = INFLUENCE_CARDS[t];
  const starCost =
    cost * (plan.kind === 'COUP_BANK' && t !== 'COUP' ? 1.2 : 0.35);
  let v = 0;
  switch (t) {
    case 'COUP': {
      const tgt = bestCoupTarget(p);
      if (tgt && tgt.value >= aiState.W.coupValueFloor) {
        return 12 - ((p.hand.COUP || 0) > 0 ? 6 : 0);
      }
      v = -2;
      break;
    }
    case 'STEAL_ACTION': {
      const loot = alive().some(
        (x) =>
          x.id !== p.id &&
          (['ATTACK', 'RECRUIT', 'MOVE', 'TRADE'] as const).some(
            (a) => (x.hand[a] || 0) > 0,
          ),
      );
      v = loot ? 1.5 : -2;
      break;
    }
    case 'PEACE': {
      v = 1 + plan.threat * 0.4;
      break;
    }
    default: {
      const target = skipTarget(p, t);
      if (!target) {
        return -2;
      }
      const allStr = alive().map((x) => playerStrength(x));
      const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1);
      v = 1 + (playerStrength(target) / Math.max(1, avgStr)) * 1.5;
    }
  }
  if ((p.hand[t] || 0) > 0) {
    v -= 1.5;
  }
  return v - starCost;
}
