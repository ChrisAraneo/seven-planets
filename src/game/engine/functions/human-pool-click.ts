import { getState } from '../state';
import { canPickCard } from './can-pick-card';
import { homePlanet } from './home-planet';
import { getPoolResolve, setPoolResolve } from './resolver-state';

export function humanPoolClick(idx: number): void {
  if (!getPoolResolve() || getState().phase !== 'draft') {
    return;
  }
  const human = getState().players[0];
  const planet =
    getState().planets[getState().draftPlanetId] || homePlanet(human);
  if (
    idx < 0 ||
    idx >= getState().pool.length ||
    !canPickCard(human, getState().pool[idx], planet)
  ) {
    return;
  }
  const r = getPoolResolve()!;
  setPoolResolve(null);
  getState().awaitingPick = false;
  r(idx);
}
