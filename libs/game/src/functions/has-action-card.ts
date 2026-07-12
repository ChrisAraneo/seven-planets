import type { ActionType } from '../interfaces/action-type';
import type { Player } from '../interfaces/player';

// Every action requires (and spends) its matching action card.
export function hasActionCard(player: Player, actionType: ActionType): boolean {
  return (player.hand[actionType] || 0) > 0;
}
