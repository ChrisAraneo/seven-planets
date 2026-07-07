import { canAfford, CARDS } from '@/game/constants';
import type { Cost, GameState, Player } from '@/game/types';
import { activateWeightsFor } from './activate-weights-for';
import { aiState } from './ai-state';
import { avgStrength } from './avg-strength';
import { handAfterCost } from './hand-after-cost';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';

export function mastermindEvaluateTrade(
  s: GameState,
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null,
): boolean {
  activateWeightsFor(ai);
  const plan = planFor(s, ai);
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
    playerStrength(s, proposer) > avgStrength(s) * 1.25
  ) {
    return vIn >= vOut * 1.5;
  }
  return vIn >= vOut * aiState.W.tradeAcceptRatio;
}
