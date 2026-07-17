import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

export const updatePlanet = (
  state: GameState,
  id: number,
  callback: (planet: Planet) => Planet,
): GameState => ({
  ...state,
  planets: state.planets.map((planet) =>
    (planet.id === id ? callback(planet) : planet),
  ),
});
