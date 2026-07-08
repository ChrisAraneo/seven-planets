import { canAfford, CARDS } from '@/game/constants';
import type { Cost, Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';
import { getGameState } from '@/stores/game-state';

import { activateWeightsFor } from './activate-weights-for';
import { avgStrength } from './avg-strength';
import { handAfterCost } from './hand-after-cost';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';

export function mastermindEvaluateTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  const aiState = getAiStore();
  const s = getGameState();
  activateWeightsFor(ai);
  const plan = planFor(ai);
  const head = plan.buildQueue[0];
  let vIn = 0;
  let vOut = 0;
  for (const t in gets) {
    vIn +=
      gets[t] *
      CARDS[t].value *
      (head && (head.cost[t] || 0) > (ai.hand[t] || 0) ? 1.35 : 1);
  }
  for (const t in gives) {
    vOut += gives[t] * CARDS[t].value;
  }
  if (head && canAfford(ai.hand, head.cost)) {
    const after = handAfterCost(ai.hand, gives);
    const afterGets: Cost = { ...after };
    for (const t in gets) {
      afterGets[t] = (afterGets[t] || 0) + gets[t];
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
