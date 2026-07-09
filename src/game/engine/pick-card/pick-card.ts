import { canPickCard } from '../common/can-pick-card';
import { homePlanet } from '../common/home-planet';
import type { GameState } from '@/game/types';
import { getPoolResolve, setPoolResolve } from '../common/resolver-state';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

export async function pick(
  state: GameState,
  payload: PickCardPayload,
): Promise<GameState> {
  const { playerId, idx } = payload;
  const resolve = getPoolResolve();

  if (!resolve || state.phase !== 'draft' || playerId !== state.activeId) {
    return state;
  }

  const p = state.players[playerId];
  const planet = state.planets[state.draftPlanetId] || homePlanet(p);

  if (
    idx < 0 ||
    idx >= state.pool.length ||
    !canPickCard(p, state.pool[idx], planet)
  ) {
    return state;
  }

  setPoolResolve(null);

  state.awaitingPick = false;

  resolve(idx);

  return state;
}
