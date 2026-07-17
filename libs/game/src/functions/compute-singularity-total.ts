import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './get-owned-planets';

export function computeSingularityTotal(
  state: GameState,
  player: Player,
): number {
  return getOwnedPlanets(state, player).reduce(
    (sum, planet) => sum + (planet.buildings.SINGULARITY || 0),
    0,
  );
}
