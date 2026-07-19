import type { Player } from '../interfaces/player';
import { IS_AUTO_HUMAN } from './auto-human';

export const isHumanControlled = (player: Player): boolean =>
  player.isHuman && !IS_AUTO_HUMAN;
