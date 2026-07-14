import { chain } from '../utils/chain';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';

import { updatePlayer } from './update-player';

interface PaymentProgress {
  hand: Hand;
  relicsNeeded: number;
}

// Spend `cost` from a player's hand, drawing on RELIC wildcards for any shortfall.
// Pure: returns a new state with the player's hand rewritten.
export function payCost(
  state: GameState,
  playerId: number,
  cost: Cost,
): GameState {
  return updatePlayer(state, playerId, (player) => ({
    ...player,
    hand: chain(Object.entries(cost))
      .reduce(
        (progress: PaymentProgress, [type, amount]) =>
          spendFromHand(progress, type, amount),
        { hand: { ...player.hand }, relicsNeeded: 0 },
      )
      .thru(({ hand, relicsNeeded }) => ({
        ...hand,
        RELIC: hand.RELIC - relicsNeeded,
      }))
      .value(),
  }));
}

function spendFromHand(
  progress: PaymentProgress,
  type: string,
  amount: number,
): PaymentProgress {
  return chain(Math.min(progress.hand[type], amount))
    .thru((use) => ({
      hand: { ...progress.hand, [type]: progress.hand[type] - use },
      relicsNeeded: progress.relicsNeeded + (amount - use),
    }))
    .value();
}
