import type { GameState } from '@/game/types';
import { canPickCard } from './can-pick-card';
import { homePlanet } from './home-planet';
import { getPoolResolve, setPoolResolve } from './resolver-state';

export function humanPoolClick(state: GameState, idx: number): void {
  if (!getPoolResolve() || state.phase !== 'draft') {
    return;
  }
  const human = state.players[0];
  const planet = state.planets[state.draftPlanetId] || homePlanet(state, human);
  if (
    idx < 0 ||
    idx >= state.pool.length ||
    !canPickCard(state, human, state.pool[idx], planet)
  ) {
    return;
  }
  const r = getPoolResolve()!;
  setPoolResolve(null);
  state.awaitingPick = false;
  r(idx);
}
