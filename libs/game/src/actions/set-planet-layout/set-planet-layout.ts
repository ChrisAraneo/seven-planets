import { dispatch } from '../../state';

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
  dispatch({ kind: 'SET_PLANET_LAYOUT', payload: layout });
}
