import { getAiState } from '../state';
import { canAfford, CARDS } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { activateWeightsFor } from './activate-weights-for';
import { avgStrength } from './avg-strength';
import { handAfterCost } from './hand-after-cost';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';

export function shouldMastermindAcceptTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  const aiState = getAiState();
  activateWeightsFor(ai);
  const plan = planFor(ai);
  const head = plan.buildQueue[0];
  let vIn = 0;
  let vOut = 0;
  for (const type in gets) {
    vIn +=
      gets[type] *
      CARDS[type].value *
      (head && (head.cost[type] || 0) > (ai.hand[type] || 0) ? 1.35 : 1);
  }
  for (const eachType in gives) {
    vOut += gives[eachType] * CARDS[eachType].value;
  }
  if (head && canAfford(ai.hand, head.cost)) {
    const after = handAfterCost(ai.hand, gives);
    const afterGets: Cost = { ...after };
    for (const innerType in gets) {
      afterGets[innerType] = (afterGets[innerType] || 0) + gets[innerType];
    }
    if (!canAfford(afterGets, head.cost)) {
      vOut *= 1.6;
    }
  }
  if (
    proposer &&
    proposer.id !== ai.id &&
    playerStrength(proposer) > avgStrength() * 1.25
  ) {
    return vIn >= vOut * 1.5;
  }
  return vIn >= vOut * aiState.W.tradeAcceptRatio;
}
