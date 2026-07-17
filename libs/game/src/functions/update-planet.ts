import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

export function updatePlanet(
  state: GameState,
  id: number,
  callback: (planet: Planet) => Planet,
): GameState {
  return {
    ...state,
    planets: state.planets.map((planet) =>
      planet.id === id ? callback(planet) : planet,
    ),
  };
}
