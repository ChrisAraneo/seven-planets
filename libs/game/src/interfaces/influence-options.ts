import type { ActionType } from './action-type';
import type { Planet } from './planet';
import type { Player } from './player';

export interface InfluenceOptions {
  target?: Player;
  cardType?: ActionType;
  planet?: Planet;
}
