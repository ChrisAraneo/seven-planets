import type { Cost, Player } from '@/game/types';

export function payCost(player: Player, cost: Cost): void {
  let relicsNeeded = 0;
  for (const t in cost) {
    const use = Math.min(player.hand[t], cost[t]);
    player.hand[t] -= use;
    relicsNeeded += cost[t] - use;
  }
  player.hand.RELIC -= relicsNeeded;
}
