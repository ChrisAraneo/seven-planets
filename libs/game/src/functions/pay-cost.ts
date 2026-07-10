import type { Cost } from '../interfaces/cost';
import type { Player } from '../interfaces/player';

export function payCost(player: Player, cost: Cost): void {
  let relicsNeeded = 0;
  for (const t in cost) {
    const use = Math.min(player.hand[t], cost[t]);
    player.hand[t] -= use;
    relicsNeeded += cost[t] - use;
  }
  player.hand.RELIC -= relicsNeeded;
}
