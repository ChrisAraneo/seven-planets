import type { Cost, Player } from '@seven-planets/game';
import { canAfford, CARDS } from '@seven-planets/game';

import { getAiState } from '../state';
import { activateWeightsFor } from './activate-weights-for';
import { computeAverageStrength } from './compute-average-strength';
import { computeHandAfterCost } from './compute-hand-after-cost';
import { computePlayerStrength } from './compute-player-strength';
import type { BuildCandidate } from './get-build-candidates';
import { getPlan } from './get-plan';

export function shouldMastermindAcceptTrade(
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  activateWeightsFor(aiPlayer);
  const head = getPlan(aiPlayer).buildQueue.at(0);
  const valueIn = computeValueIn(aiPlayer, gets, head);
  let valueOut = Object.entries(gives).reduce(
    (sum, [resourceType, amount]) => sum + amount * CARDS[resourceType].value,
    0,
  );
  if (wouldBlockGoal(aiPlayer, head, gives, gets)) {
    valueOut *= 1.6;
  }
  if (
    proposer &&
    proposer.id !== aiPlayer.id &&
    computePlayerStrength(proposer) > computeAverageStrength() * 1.25
  ) {
    return valueIn >= valueOut * 1.5;
  }
  return valueIn >= valueOut * getAiState().W.tradeAcceptRatio;
}

// Incoming cards the build goal is short of count extra.
function computeValueIn(
  aiPlayer: Player,
  gets: Cost,
  head: BuildCandidate | undefined,
): number {
  return Object.entries(gets).reduce(
    (sum, [resourceType, amount]) =>
      sum +
      amount *
        CARDS[resourceType].value *
        (head &&
        (head.cost[resourceType] || 0) > (aiPlayer.hand[resourceType] || 0)
          ? 1.35
          : 1),
    0,
  );
}

// Affording the goal now but not after the trade makes giving pricier.
function wouldBlockGoal(
  aiPlayer: Player,
  head: BuildCandidate | undefined,
  gives: Cost,
  gets: Cost,
): boolean {
  if (!head || !canAfford(aiPlayer.hand, head.cost)) {
    return false;
  }
  const remainingWithGets: Cost = {
    ...computeHandAfterCost(aiPlayer.hand, gives),
  };
  for (const [resourceType, amount] of Object.entries(gets)) {
    remainingWithGets[resourceType] =
      (remainingWithGets[resourceType] || 0) + amount;
  }
  return !canAfford(remainingWithGets, head.cost);
}
