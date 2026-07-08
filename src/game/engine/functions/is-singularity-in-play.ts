import { maxLevel } from '@/game/constants';
import type { GameState } from '@/game/types';
import { alivePlayers } from './alive-players';
import { ownedPlanets } from './owned-planets';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import { techLevel } from './tech-level';

// The Singularity card is only dealt while someone can still build or upgrade one:
// The next level must be within their technology and satisfy the Lab requirement.
export function isSingularityInPlay(state: GameState): boolean {
  return alivePlayers(state).some((p) =>
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
