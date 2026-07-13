import { match, P } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import { dispatch } from '../../state';

const { nullish } = P;

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

/** Install the board's planet coordinates: the board view computes planet
    positions (canvas geometry) and commits them here; effects (rockets,
    booms, floating text) read the same coordinates off the planets in
    state. Event creator: application lives in the reducer. */
export function setPlanetLayout(layout: readonly PlanetLayout[]): void {
  dispatch({ kind: 'layout', payload: layout });
}

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
