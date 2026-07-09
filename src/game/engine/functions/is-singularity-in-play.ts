import { maxLevel } from '@/game/constants';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';

import { filterAlivePlayers } from '@/game/actions/common/alive-players';
import { ownedPlanets } from '@/game/actions/common/owned-planets';
import { techLevel } from '@/game/actions/common/tech-level';

// The Singularity card is only dealt while someone can still build or upgrade one:
// The next level must be within their technology and satisfy the Lab requirement.
export function isSingularityInPlay(): boolean {
  return filterAlivePlayers().some((p) =>
    ownedPlanets(p).some((pl) => {
      const next = (pl.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(p) &&
        isSingularityLabOk(pl, next)
      );
    }),
  );
}
