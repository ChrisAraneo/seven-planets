import { maxLevel } from '../config/constants';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';
import { getTechLevel } from './get-tech-level';

// The owned planet where the Singularity can still be built or upgraded.
export function singularityReadyPlanet(
  state: GameState,
  player: Player,
): Planet | undefined {
  const cap = Math.min(maxLevel('SINGULARITY'), getTechLevel(state, player));
  return ownedPlanets(state, player).find((planet) => {
    const next = (planet.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(planet, next);
  });
}
