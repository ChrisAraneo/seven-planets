import type { ActionType } from '../interfaces/action-type';
import type { Player } from '../interfaces/player';

export function spendActionCard(player: Player, actionType: ActionType): void {
  player.hand[actionType] = Math.max(0, (player.hand[actionType] || 0) - 1);
}
