import { getAiState } from '../state';
import { canAfford, CARDS } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { activateWeightsFor } from './activate-weights-for';
import { computeAverageStrength } from './compute-average-strength';
import { computeHandAfterCost } from './compute-hand-after-cost';
import { getPlan } from './get-plan';
import { computePlayerStrength } from './compute-player-strength';

export function shouldMastermindAcceptTrade(
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  const aiState = getAiState();
  activateWeightsFor(aiPlayer);
  const plan = getPlan(aiPlayer);
  const head = plan.buildQueue[0];
  let valueIn = 0;
  let valueOut = 0;
  for (const resourceType in gets) {
    valueIn +=
      gets[resourceType] *
      CARDS[resourceType].value *
      (head &&
      (head.cost[resourceType] || 0) > (aiPlayer.hand[resourceType] || 0)
        ? 1.35
        : 1);
  }
  for (const resourceType in gives) {
    valueOut += gives[resourceType] * CARDS[resourceType].value;
  }
  if (head && canAfford(aiPlayer.hand, head.cost)) {
    const remainingHand = computeHandAfterCost(aiPlayer.hand, gives);
    const remainingWithGets: Cost = { ...remainingHand };
    for (const resourceType in gets) {
      remainingWithGets[resourceType] =
        (remainingWithGets[resourceType] || 0) + gets[resourceType];
    }
    if (!canAfford(remainingWithGets, head.cost)) {
      valueOut *= 1.6;
    }
  }
  if (
    proposer &&
    proposer.id !== aiPlayer.id &&
    computePlayerStrength(proposer) > computeAverageStrength() * 1.25
  ) {
    return valueIn >= valueOut * 1.5;
  }
  return valueIn >= valueOut * aiState.W.tradeAcceptRatio;
}
