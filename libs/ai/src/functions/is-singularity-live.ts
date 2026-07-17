import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export function isSingularityLive(): boolean {
  return getAlivePlayers().some((player) =>
    getOwnedPlanets(player).some((planet) => {
      const nextLevel = (planet.buildings.SINGULARITY || 0) + 1;
      return (
        nextLevel <= getMaxLevel('SINGULARITY') &&
        nextLevel <= computeTechLevel(player) &&
        isSingularityLabOk(planet, nextLevel)
      );
    }),
  );
}
