import type { Player } from './player';
import type { Cost } from './cost';

/** A concrete trade offer passed between players. */
export interface TradeOffer {
  partner: Player;
  gives: Cost;
  gets: Cost;
}
