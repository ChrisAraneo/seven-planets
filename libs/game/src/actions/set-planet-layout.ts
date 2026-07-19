import { dispatch } from '../dispatch';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

export const setPlanetLayout = (layout: readonly PlanetLayout[]): void => {
  dispatch({ kind: 'SET_PLANET_LAYOUT', payload: layout });
};
