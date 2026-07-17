import type { Player } from '../interfaces/player';

export function isPacifist(player: Player): boolean {
  return player.hasPacifistStatus;
}
