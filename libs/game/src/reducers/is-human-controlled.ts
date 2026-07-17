import { IS_AUTO_HUMAN } from '../functions/auto-human';
import type { Player } from '../interfaces/player';

export const isHumanControlled = (player: Player): boolean =>
  player.isHuman && !IS_AUTO_HUMAN;
