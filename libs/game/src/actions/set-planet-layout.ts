import { match, P } from 'ts-pattern';
import { getGameState, setGameState } from '../game-state';

const { nullish } = P;

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

// The board view computes planet positions (canvas geometry) and commits them
// here; effects (rockets, booms, floating text) read the same coordinates off
// the planets in state.
export function setPlanetLayout(layout: readonly PlanetLayout[]): void {
  return setGameState({
    ...getGameState(),
    planets: getGameState().planets.map((pl, i) =>
      match(layout[i])
        .with(nullish, () => pl)
        .otherwise((coords) => ({ ...pl, ...coords })),
    ),
  });
}
