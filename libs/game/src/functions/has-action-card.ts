import type { ActionType } from '../interfaces/action-type';
import type { Player } from '../interfaces/player';

// Every action requires (and spends) its matching action card.
export function hasActionCard(p: Player, t: ActionType): boolean {
  return (p.hand[t] || 0) > 0;
}
