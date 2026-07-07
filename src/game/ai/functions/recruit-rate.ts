import type { GameState, Player } from '@/game/types';
import { actionDrawProb } from './action-draw-prob';
import { incomePerTurn } from './income-per-turn';
import { owned } from './owned';
import { recruitYieldOf } from './recruit-yield-of';

export function recruitRate(s: GameState, p: Player): number {
  let bestYield = 0;
  for (const pl of owned(s, p)) {
    bestYield = Math.max(bestYield, recruitYieldOf(pl));
  }
  if (!bestYield) {
    return 0;
  }
  const oreFlow = (incomePerTurn(s, p).ORE || 0) + (p.hand.ORE || 0) / 4;
  const cardFlow =
    (p.hand.RECRUIT || 0) > 0 ? 0.9 : actionDrawProb(s, 'RECRUIT');
  return Math.min(bestYield, Math.max(0, oreFlow)) * cardFlow;
}
