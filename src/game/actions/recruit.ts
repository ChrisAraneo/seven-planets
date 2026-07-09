import { getGameState } from '@/stores/game-state';

import { hasActionCard } from '../engine/functions/has-action-card';
import { recruit as engineRecruit } from '../engine/functions/recruit';

/* The `recruit` store action: raise troops on one of the acting player's
   planets (requires a Barracks there). The human's RecruitModal and the
   AI agent both dispatch this. Returns whether a recruit was attempted. */
export function recruit(payload: {
  playerId: number;
  planetId: number;
}): boolean {
  const state = getGameState();
  const { playerId, planetId } = payload;
  if (playerId !== state.activeId || state.over) {
    return false;
  }
  const p = state.players[playerId];
  if (!hasActionCard(p, 'RECRUIT')) {
    return false;
  }
  engineRecruit(p, state.planets[planetId]);
  return true;
}
