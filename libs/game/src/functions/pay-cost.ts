import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';
import { chain } from '../utils/chain';
import { spendFromHand } from './spend-from-hand';
import { updatePlayer } from './update-player';

export interface PaymentProgress {
  hand: Hand;
  relicsNeeded: number;
}

export const payCost = (
  state: GameState,
  playerId: number,
  cost: Cost,
): GameState =>
  updatePlayer(state, playerId, (player) => ({
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
