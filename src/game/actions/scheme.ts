import type { InfluenceOpts, InfluenceType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { useInfluenceCard } from '../engine/functions/use-influence-card';

/* The `scheme` store action: play a held influence card (skip, steal,
   coup, peace). The human's InfluenceModal and the AI agent both
   dispatch this. Returns whether the card was actually played. */
export function scheme(payload: {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}): boolean {
  const state = getGameState();
  const { playerId, type, opts } = payload;
  if (playerId !== state.activeId || state.over) {
    return false;
  }
  return useInfluenceCard(state.players[playerId], type, opts ?? {});
}
