import { SINGULARITY_DEF_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

const SINGULARITY_DEFENSE_LEVEL = 4;

export function computeSingularityDefenseBonus(planet: Planet): number {
  return (
    Number((planet.buildings.SINGULARITY || 0) >= SINGULARITY_DEFENSE_LEVEL) *
    SINGULARITY_DEF_BONUS
  );
}
