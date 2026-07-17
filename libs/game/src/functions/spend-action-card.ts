import type { ActionType } from '../interfaces/action-type';
import type { GameState } from '../interfaces/game-state';
import { updatePlayer } from './update-player';

export function spendActionCard(
  state: GameState,
  playerId: number,
  actionType: ActionType,
): GameState {
  return updatePlayer(state, playerId, (player) => ({
    ...player,
    hand: {
      ...player.hand,
      [actionType]: Math.max(0, (player.hand[actionType] || 0) - 1),
    },
  }));
}
