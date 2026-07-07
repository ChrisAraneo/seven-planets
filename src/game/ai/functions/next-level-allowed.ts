import { maxLevel } from '@/game/constants';
import type { BuildingType, GameState, Planet, Player } from '@/game/types';
import { techLevel } from './tech-level';
import { singularityLabOk } from './singularity-lab-ok';

export function nextLevelAllowed(
  s: GameState,
  p: Player,
  planet: Planet,
  id: BuildingType,
): number {
  const next = (planet.buildings[id] || 0) + 1;
  if (next > maxLevel(id)) {
    return 0;
  }
  if (next > techLevel(s, p)) {
    return 0;
  }
  if (id === 'SINGULARITY' && !singularityLabOk(planet, next)) {
    return 0;
  }
  return next;
}
