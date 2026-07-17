import type { BuildingType, Planet, Player } from '@seven-planets/game';
import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { computeTechLevel } from './compute-tech-level';

export function getNextAllowedLevel(
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): number {
  const nextLevel = (planet.buildings[buildingType] || 0) + 1;
  if (nextLevel > getMaxLevel(buildingType)) {
    return 0;
  }
  if (nextLevel > computeTechLevel(player)) {
    return 0;
  }
  if (
    buildingType === 'SINGULARITY' &&
    !isSingularityLabOk(planet, nextLevel)
  ) {
    return 0;
  }
  return nextLevel;
}
