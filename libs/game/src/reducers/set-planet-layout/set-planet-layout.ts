import { match, P } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import type { PlanetLayout } from '../../actions/set-planet-layout/set-planet-layout';

const { nullish } = P;

// Reducer branch. Pure presentation geometry — legal at any time.
export function applySetPlanetLayout(
  state: GameState,
  layout: readonly PlanetLayout[],
): GameState {
  return {
    ...state,
    planets: state.planets.map((planet, index) =>
      match(layout[index])
        .with(nullish, () => planet)
        .otherwise((coords) => ({ ...planet, ...coords })),
    ),
  };
}
