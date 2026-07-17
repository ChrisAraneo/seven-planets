import type { Cost } from './cost';
import type { Player } from './player';

/** A concrete trade offer passed between players. */
export interface TradeOffer {
  partner: Player;
  gives: Cost;
  gets: Cost;
}
