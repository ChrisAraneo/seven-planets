import { maxLevel } from '@/game/constants';
import { alivePlayers } from './alive-players';
import { ownedPlanets } from './owned-planets';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import { techLevel } from './tech-level';

// The Singularity card is only dealt while someone can still build or upgrade one:
// The next level must be within their technology and satisfy the Lab requirement.
export function isSingularityInPlay(): boolean {
  return alivePlayers().some((p) =>
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
