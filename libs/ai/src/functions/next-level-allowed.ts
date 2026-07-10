import { maxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';
import type { BuildingType, Planet, Player } from '@seven-planets/game';

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
