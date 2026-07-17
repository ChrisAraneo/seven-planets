import { dispatch } from '../../state';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

export function setPlanetLayout(layout: readonly PlanetLayout[]): void {
  dispatch({ kind: 'SET_PLANET_LAYOUT', payload: layout });
}
