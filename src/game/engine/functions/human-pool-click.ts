import { getGameState } from '@/stores/game-state';

import { canPickCard } from './can-pick-card';
import { homePlanet } from './home-planet';
import { getPoolResolve, setPoolResolve } from './resolver-state';

export function humanPoolClick(idx: number): void {
  const state = getGameState();
  if (!getPoolResolve() || state.phase !== 'draft') {
    return;
  }
  const human = state.players[0];
  const planet = state.planets[state.draftPlanetId] || homePlanet(human);
  if (
    idx < 0 ||
    idx >= state.pool.length ||
    !canPickCard(human, state.pool[idx], planet)
  ) {
    return;
  }
  const r = getPoolResolve()!;
  setPoolResolve(null);
  state.awaitingPick = false;
  r(idx);
}
