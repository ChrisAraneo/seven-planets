import { SINGULARITY_DEF_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

const SINGULARITY_DEFENSE_LEVEL = 4;

export const computeSingularityDefenseBonus = (planet: Planet): number =>
  Number((planet.buildings.SINGULARITY || 0) >= SINGULARITY_DEFENSE_LEVEL) *
  SINGULARITY_DEF_BONUS;
