import type { Player } from '../interfaces/player';

export const isPacifist = (player: Player): boolean => player.hasPacifistStatus;
