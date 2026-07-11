import { SINGULARITY_DEF_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// A level-4 Singularity warps local space into a shield: flat +8 defense.
export function singularityDefBonus(planet: Planet): number {
  return (planet.buildings.SINGULARITY || 0) >= 4 ? SINGULARITY_DEF_BONUS : 0;
}
