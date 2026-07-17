import type { ActionType } from './action-type';
import type { Planet } from './planet';
import type { Player } from './player';

/** Options carried when playing an influence card. */
export interface InfluenceOptions {
  target?: Player;
  cardType?: ActionType;
  planet?: Planet;
}
