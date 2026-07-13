import type { Player } from './player';
import type { ActionType } from './action-type';
import type { Planet } from './planet';

/** Options carried when playing an influence card. */
export interface InfluenceOpts {
  target?: Player;
  cardType?: ActionType;
  planet?: Planet;
}
