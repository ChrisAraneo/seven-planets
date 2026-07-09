import type { Cost } from './cost';

/** An incoming trade offer the target seat (`toId`) must respond to. */
export interface PendingOffer {
  fromId: number;
  toId: number;
  gives: Cost;
  gets: Cost;
}
