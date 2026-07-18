import type { Cost, Player } from '@seven-planets/game';
import { isResourceType } from '@seven-planets/game';

import { shouldMastermindAcceptTrade } from './should-mastermind-accept-trade';

export const shouldAcceptTrade = (
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean =>
  Object.keys(gives).every(
    (resourceType) =>
      isResourceType(resourceType) || (gives[resourceType] || 0) <= 0,
  ) &&
  Object.keys(gets).every(
    (resourceType) =>
      isResourceType(resourceType) || (gets[resourceType] || 0) <= 0,
  ) &&
  Object.keys(gives).every(
    (resourceType) => (aiPlayer.hand[resourceType] || 0) >= gives[resourceType],
  ) &&
  shouldMastermindAcceptTrade(aiPlayer, gives, gets, proposer);
