import { maxLevel } from '@/game/config/constants';
import { isSingularityLabOk } from '@/stores/game/functions/is-singularity-lab-ok';
import type { BuildingType, Planet, Player } from '@/game/types';

import { techLevel } from './tech-level';

export function nextLevelAllowed(
  p: Player,
  planet: Planet,
  id: BuildingType,
): number {
  const next = (planet.buildings[id] || 0) + 1;
  if (next > maxLevel(id)) {
    return 0;
  }
  if (next > techLevel(p)) {
    return 0;
  }
  if (id === 'SINGULARITY' && !isSingularityLabOk(planet, next)) {
    return 0;
  }
  return next;
}
