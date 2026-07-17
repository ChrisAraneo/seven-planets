import type { ActionType } from '../interfaces/action-type';
import type { Player } from '../interfaces/player';

export const hasActionCard = (
  player: Player,
  actionType: ActionType,
): boolean => (player.hand[actionType] || 0) > 0;
