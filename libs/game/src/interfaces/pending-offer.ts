import type { Cost } from './cost';

export interface PendingOffer {
  fromId: number;
  toId: number;
  gives: Cost;
  gets: Cost;
}
