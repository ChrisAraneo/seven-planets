import { maxLevel } from '../config/constants';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import type { GameState } from '../interfaces/game-state';

import { filterAlivePlayers } from './filter-alive-players';
import { ownedPlanets } from './owned-planets';
import { getTechLevel } from './get-tech-level';

// The Singularity card is only dealt while someone can still build or upgrade one:
// The next level must be within their technology and satisfy the Lab requirement.
export function isSingularityInPlay(state: GameState): boolean {
  return filterAlivePlayers(state).some((player) =>
    ownedPlanets(state, player).some((planet) => {
      const next = (planet.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= getTechLevel(state, player) &&
        isSingularityLabOk(planet, next)
      );
    }),
  );
}
