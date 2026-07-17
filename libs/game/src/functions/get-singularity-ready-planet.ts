import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';
import { isSingularityLabOk } from './is-singularity-lab-ok';

export const getSingularityReadyPlanet = (
  state: GameState,
  player: Player,
): Planet | undefined => {
  const capacity = Math.min(
    getMaxLevel('SINGULARITY'),
    getTechLevel(state, player),
  );
  return getOwnedPlanets(state, player).find((planet) => {
    const next = (planet.buildings.SINGULARITY || 0) + 1;
    return next <= capacity && isSingularityLabOk(planet, next);
  });
};
