import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

export const updatePlanet = (
  state: GameState,
  id: number,
  callback: (planet: Planet) => Planet,
): GameState => ({
  ...state,
  planets: state.planets.map((planet) =>
    match(planet)
      .when((candidate) => candidate.id === id, callback)
      .otherwise(() => planet),
  ),
});
