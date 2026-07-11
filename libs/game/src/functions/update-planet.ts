import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

// Copy-on-write: return a new state whose planet `id` is replaced by `fn(planet)`.
// Every other planet, and the rest of the state tree, is shared by reference.
// Short-circuit expression (fn always returns an object): engine hot path.
export function updatePlanet(
  state: GameState,
  id: number,
  fn: (planet: Planet) => Planet,
): GameState {
  return {
    ...state,
    planets: state.planets.map((pl) => (pl.id === id && fn(pl)) || pl),
  };
}
