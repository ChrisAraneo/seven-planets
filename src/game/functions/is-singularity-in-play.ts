import { maxLevel } from '@/game/config/constants';
import { isSingularityLabOk } from '@/game/functions/is-singularity-lab-ok';
import type { GameState } from '@/game/types';

import { filterAlivePlayers } from '@/game/functions/filter-alive-players';
import { ownedPlanets } from '@/game/functions/owned-planets';
import { techLevel } from '@/game/functions/tech-level';

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
