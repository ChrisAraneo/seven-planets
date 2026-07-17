import type { GameState } from '../interfaces/game-state';
import { filterAlivePlayers } from './filter-alive-players';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';
import { isSingularityLabOk } from './is-singularity-lab-ok';

export const isSingularityInPlay = (state: GameState): boolean =>
  filterAlivePlayers(state).some((player) =>
    getOwnedPlanets(state, player).some((planet) => {
      const next = (planet.buildings.SINGULARITY || 0) + 1;
      return (
        next <= getMaxLevel('SINGULARITY') &&
        next <= getTechLevel(state, player) &&
        isSingularityLabOk(planet, next)
      );
    }),
  );
