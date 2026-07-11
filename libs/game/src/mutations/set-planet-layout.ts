import type { GameModuleState } from '../game';
import { setState } from './set-state';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

// The board view computes planet positions (canvas geometry) and commits them
// here; effects (rockets, booms, floating text) read the same coordinates off
// the planets in state.
export function setPlanetLayout(
  moduleState: GameModuleState,
  layout: readonly PlanetLayout[],
): void {
  setState(moduleState, {
    ...moduleState.state,
    planets: moduleState.state.planets.map((pl, i) =>
      layout[i] ? { ...pl, ...layout[i] } : pl,
    ),
  });
}
