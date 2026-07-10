import { recruitYield } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { actionDrawProb } from './action-draw-prob';
import { incomePerTurn } from './income-per-turn';
import { owned } from './owned';

export function recruitRate(p: Player): number {
  let bestYield = 0;
  for (const pl of owned(p)) {
    bestYield = Math.max(bestYield, recruitYield(pl));
  }
  if (!bestYield) {
    return 0;
  }
  const oreFlow = (incomePerTurn(p).ORE || 0) + (p.hand.ORE || 0) / 4;
  const cardFlow = (p.hand.RECRUIT || 0) > 0 ? 0.9 : actionDrawProb('RECRUIT');
  return Math.min(bestYield, Math.max(0, oreFlow)) * cardFlow;
}
