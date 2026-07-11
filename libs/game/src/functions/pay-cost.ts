import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';

import { updatePlayer } from './update-player';

// Spend `cost` from a player's hand, drawing on RELIC wildcards for any shortfall.
// Pure: returns a new state with the player's hand rewritten.
export function payCost(
  state: GameState,
  playerId: number,
  cost: Cost,
): GameState {
  return updatePlayer(state, playerId, (player) => {
    const hand = { ...player.hand };
    let relicsNeeded = 0;
    for (const t in cost) {
      const use = Math.min(hand[t], cost[t]);
      hand[t] -= use;
      relicsNeeded += cost[t] - use;
    }
    hand.RELIC -= relicsNeeded;
    return { ...player, hand };
  });
}
