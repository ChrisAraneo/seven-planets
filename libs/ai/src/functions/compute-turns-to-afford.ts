import type { Cost, Player } from '@seven-planets/game';

import { computeIncomePerTurn } from './compute-income-per-turn';

export function computeTurnsToAfford(player: Player, cost: Cost): number {
  const income = computeIncomePerTurn(player);
  let wildcards = (player.hand.RELIC || 0) - (cost.RELIC || 0);
  let turns = 0;
  for (const resourceType of Object.keys(cost)) {
    let shortfall = cost[resourceType] - (player.hand[resourceType] || 0);
    if (shortfall <= 0) {
      continue;
    }
    const wildcardsUsed = Math.min(Math.max(0, wildcards), shortfall);
    wildcards -= wildcardsUsed;
    shortfall -= wildcardsUsed;
    if (shortfall <= 0) {
      continue;
    }
    const incomeFlow = (income[resourceType] || 0) + 0.35;
    turns = Math.max(turns, shortfall / incomeFlow);
  }
  return turns;
}
