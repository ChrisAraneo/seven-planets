import {
  buildingCost,
  maxLevel,
  PRIORITIES,
  RESOURCE_TYPES,
} from '@/game/config/constants';
import type {
  BuildingType,
  Cost,
  GameState,
  Planet,
  Player,
} from '@/game/types';

import { ownedPlanets } from '@/game/functions/owned-planets';
import { persOf } from './pers-of';
import { singularityReadyPlanet } from '../functions/singularity-ready-planet';
import { techLevel } from '@/game/functions/tech-level';

// The next thing this player is saving for (used for drafting, trading, refusals).
export function currentGoal(
  state: GameState,
  p: Player,
): { id: BuildingType; planet: Planet; cost: Cost } | null {
  const readyPl = singularityReadyPlanet(state, p);
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
  const tech = techLevel(state, p);
  for (const id of PRIORITIES[persOf(p)]) {
    if (id === 'SINGULARITY') {
      continue;
    } // Handled above — needs a Lab of the same level
    const cap = Math.min(maxLevel(id), tech);
    const pl = ownedPlanets(state, p).find((x) => (x.buildings[id] || 0) < cap);
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
