import type { ActionType, Player } from '@/game/types';

export function spendActionCard(player: Player, actionType: ActionType): void {
  player.hand[actionType] = Math.max(0, (player.hand[actionType] || 0) - 1);
}
