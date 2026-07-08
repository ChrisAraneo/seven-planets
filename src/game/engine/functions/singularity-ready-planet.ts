import { buildingCost, maxLevel } from '@/game/constants';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import type { BuildingType, Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { ownedPlanets } from './owned-planets';
import { techLevel } from './tech-level';

// The owned planet where the Singularity can still be built or upgraded.
export function singularityReadyPlanet(p: Player): Planet | undefined {
  const state = getGameState();
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(p));
  return ownedPlanets(p).find((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(pl, next);
  });
}
