import type { ActionType, Player } from '@/game/types';

// Every action requires (and spends) its matching action card.
export function hasActionCard(p: Player, t: ActionType): boolean {
  return (p.hand[t] || 0) > 0;
}
