import { getGameState } from '@/stores/game-state';

import { hasActionCard } from '../engine/functions/has-action-card';
import { moveTroops } from '../engine/functions/move-troops';
import { setBusy } from '../engine/functions/set-busy';

/* The `move` store action: redeploy troops between two of the acting
   player's planets. The human's MoveModal and the AI agent both dispatch
   this. Returns whether a Move card was spent on the redeployment. */
export async function move(payload: {
  playerId: number;
  fromId: number;
  toId: number;
  n: number;
}): Promise<boolean> {
  const state = getGameState();
  const { playerId, fromId, toId, n } = payload;
  if (playerId !== state.activeId || state.over) {
    return false;
  }
  const p = state.players[playerId];
  if (!hasActionCard(p, 'MOVE')) {
    return false;
  }
  setBusy(true);
  try {
    await moveTroops(p, state.planets[fromId], state.planets[toId], n);
  } finally {
    setBusy(false);
  }
  return true;
}
