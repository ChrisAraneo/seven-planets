import type { ActionType, Player } from '@/game/types';

export function spendActionCard(p: Player, t: ActionType): void {
  p.hand[t] = Math.max(0, (p.hand[t] || 0) - 1);
}
