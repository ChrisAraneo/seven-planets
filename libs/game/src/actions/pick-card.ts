import { canPickCard } from '../functions/can-pick-card';
import { homePlanet } from '../functions/home-planet';
import { getPoolResolve, setPoolResolve } from '../functions/resolver-state';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

export async function pickCard(payload: PickCardPayload): Promise<void> {
  const state = cloneDeep(getGameState());
  const { playerId, idx } = payload;
  const resolve = getPoolResolve();

  if (!resolve || state.phase !== 'draft' || playerId !== state.activeId) {
    return;
  }

  const p = state.players[playerId];
  const planet = state.planets[state.draftPlanetId] || homePlanet(state, p);

  if (
    idx < 0 ||
    idx >= state.pool.length ||
    !canPickCard(state, p, state.pool[idx], planet)
  ) {
    return;
  }

  setPoolResolve(null);

  state.awaitingPick = false;

  resolve(idx);

  setGameState(state);
}
