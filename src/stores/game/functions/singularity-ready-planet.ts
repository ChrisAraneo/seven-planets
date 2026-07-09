import { maxLevel } from '@/game/config/constants';
import { isSingularityLabOk } from '@/stores/game/functions/is-singularity-lab-ok';
import type { GameState, Planet, Player } from '@/game/types';

import { ownedPlanets } from '@/stores/game/functions/owned-planets';
import { techLevel } from '@/stores/game/functions/tech-level';

// The owned planet where the Singularity can still be built or upgraded.
export function singularityReadyPlanet(
  state: GameState,
  p: Player,
): Planet | undefined {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(state, p));
  return ownedPlanets(state, p).find((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(pl, next);
  });
}
