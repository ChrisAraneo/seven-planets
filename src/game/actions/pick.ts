import {
  getPoolResolve,
  setPoolResolve,
} from '@/game/engine/functions/resolver-state';
import { getGameState } from '@/stores/game-state';

import { canPickCard } from '../engine/functions/can-pick-card';
import { homePlanet } from '../engine/functions/home-planet';

/* The `pick` store action: take a card from the draft pool for the seat in
   play. The human's pool click and the AI agent both dispatch this; it
   answers the engine's parked waitPoolPick(). Invalid picks (not this
   seat's turn, unpickable card) are ignored. */
export function pick(payload: { playerId: number; idx: number }): void {
  const state = getGameState();
  const { playerId, idx } = payload;
  const resolve = getPoolResolve();
  if (!resolve || state.phase !== 'draft' || playerId !== state.activeId) {
    return;
  }
  const p = state.players[playerId];
  const planet = state.planets[state.draftPlanetId] || homePlanet(p);
  if (
    idx < 0 ||
    idx >= state.pool.length ||
    !canPickCard(p, state.pool[idx], planet)
  ) {
    return;
  }
  setPoolResolve(null);
  state.awaitingPick = false;
  resolve(idx);
}
