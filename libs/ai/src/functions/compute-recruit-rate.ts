import { computeRecruitYield } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { computeActionDrawProbability } from './compute-action-draw-probability';
import { computeIncomePerTurn } from './compute-income-per-turn';
import { getOwnedPlanets } from './get-owned-planets';

export function computeRecruitRate(player: Player): number {
  let bestYield = 0;
  for (const planet of getOwnedPlanets(player)) {
    bestYield = Math.max(bestYield, computeRecruitYield(planet));
  }
  if (!bestYield) {
    return 0;
  }
  const oreFlow =
    (computeIncomePerTurn(player).ORE || 0) + (player.hand.ORE || 0) / 4;
  const cardFlow =
    (player.hand.RECRUIT || 0) > 0
      ? 0.9
      : computeActionDrawProbability('RECRUIT');
  return Math.min(bestYield, Math.max(0, oreFlow)) * cardFlow;
}
