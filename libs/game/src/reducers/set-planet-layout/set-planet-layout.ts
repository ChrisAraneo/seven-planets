import { match } from 'ts-pattern';

import type { PlanetLayout } from '../../actions/set-planet-layout/set-planet-layout';
import type { GameState } from '../../interfaces/game-state';
import { nullish } from '../../utils/p';

export const applySetPlanetLayout = (
  state: GameState,
  layout: readonly PlanetLayout[],
): GameState => ({
  ...state,
  planets: state.planets.map((planet, index) =>
    match(layout[index])
      .with(nullish, () => planet)
      .otherwise((coords) => ({ ...planet, ...coords })),
  ),
});
