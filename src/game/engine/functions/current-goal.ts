import {
  buildingCost,
  maxLevel,
  PRIORITIES,
  RESOURCE_TYPES,
} from '@/game/constants';
import type { BuildingType, Cost, Planet, Player } from '@/game/types';

import { ownedPlanets } from '@/game/actions/common/owned-planets';
import { persOf } from './pers-of';
import { singularityReadyPlanet } from './singularity-ready-planet';
import { techLevel } from '@/game/actions/common/tech-level';

// The next thing this player is saving for (used for drafting, trading, refusals).
export function currentGoal(
  p: Player,
): { id: BuildingType; planet: Planet; cost: Cost } | null {
  const readyPl = singularityReadyPlanet(p);
  if (readyPl) {
    return {
      id: 'SINGULARITY',
      planet: readyPl,
      cost: buildingCost(
        'SINGULARITY',
        (readyPl.buildings.SINGULARITY || 0) + 1,
      ),
    };
  }
  const tech = techLevel(p);
  for (const id of PRIORITIES[persOf(p)]) {
    if (id === 'SINGULARITY') {
      continue;
    } // Handled above — needs a Lab of the same level
    const cap = Math.min(maxLevel(id), tech);
    const pl = ownedPlanets(p).find((x) => (x.buildings[id] || 0) < cap);
    if (pl) {
      return {
        id,
        planet: pl,
        cost: buildingCost(id, (pl.buildings[id] || 0) + 1),
      };
    }
  }
  return null;
}
