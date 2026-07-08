import { buildingCost, maxLevel } from '@/game/constants';
import type { BuildingType, GameState, Planet, Player } from '@/game/types';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import { ownedPlanets } from './owned-planets';
import { techLevel } from './tech-level';

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
