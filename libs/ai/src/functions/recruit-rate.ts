import { recruitYield } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { actionDrawProb } from './action-draw-prob';
import { incomePerTurn } from './income-per-turn';
import { owned } from './owned';

export function recruitRate(player: Player): number {
  let bestYield = 0;
  for (const planet of owned(player)) {
    bestYield = Math.max(bestYield, recruitYield(planet));
  }
  if (!bestYield) {
    return 0;
  }
  const oreFlow = (incomePerTurn(player).ORE || 0) + (player.hand.ORE || 0) / 4;
  const cardFlow =
    (player.hand.RECRUIT || 0) > 0 ? 0.9 : actionDrawProb('RECRUIT');
  return Math.min(bestYield, Math.max(0, oreFlow)) * cardFlow;
}
