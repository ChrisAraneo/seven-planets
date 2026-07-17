import type { Cost, Player } from '@seven-planets/game';
import { isResourceType } from '@seven-planets/game';

import { shouldMastermindAcceptTrade } from './should-mastermind-accept-trade';

export const shouldAcceptTrade = (
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean => {
  for (const resourceType in gives) {
    if (!isResourceType(resourceType) && (gives[resourceType] || 0) > 0) {
      return false;
    }
  }
  for (const resourceType in gets) {
    if (!isResourceType(resourceType) && (gets[resourceType] || 0) > 0) {
      return false;
    }
  }
  for (const resourceType in gives) {
    if ((aiPlayer.hand[resourceType] || 0) < gives[resourceType]) {
      return false;
    }
  }
  return shouldMastermindAcceptTrade(aiPlayer, gives, gets, proposer);
};
