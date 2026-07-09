import { maxLevel } from '@/game/constants';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import type { BuildingType, Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { techLevel } from './tech-level';

export function nextLevelAllowed(
  p: Player,
  planet: Planet,
  id: BuildingType,
): number {
  const s = getGameState();
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
