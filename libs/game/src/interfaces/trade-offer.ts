import type { Cost } from './cost';
import type { Player } from './player';

export interface TradeOffer {
  partner: Player;
  gives: Cost;
  gets: Cost;
}
