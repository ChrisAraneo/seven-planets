import { maxLevel } from '../config/constants';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import type { GameState } from '../interfaces/game-state';

import { filterAlivePlayers } from './filter-alive-players';
import { ownedPlanets } from './owned-planets';
import { techLevel } from './tech-level';

// The Singularity card is only dealt while someone can still build or upgrade one:
// The next level must be within their technology and satisfy the Lab requirement.
export function isSingularityInPlay(state: GameState): boolean {
  return filterAlivePlayers(state).some((p) =>
    ownedPlanets(state, p).some((pl) => {
      const next = (pl.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(state, p) &&
        isSingularityLabOk(pl, next)
      );
    }),
  );
}
