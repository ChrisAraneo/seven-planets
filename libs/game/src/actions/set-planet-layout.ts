import { getGameState, setGameState } from '../game-state';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

// The board view computes planet positions (canvas geometry) and commits them
// here; effects (rockets, booms, floating text) read the same coordinates off
// the planets in state.
export function setPlanetLayout(layout: readonly PlanetLayout[]): void {
  const state = getGameState();
  setGameState({
    ...state,
    planets: state.planets.map((pl, i) =>
      layout[i] ? { ...pl, ...layout[i] } : pl,
    ),
  });
}
