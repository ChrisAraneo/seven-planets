import { SINGULARITY_DEF_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './extractors/get-building-level';

const SINGULARITY_DEFENSE_LEVEL = 4;

export const computeSingularityDefenseBonus = (planet: Planet): number =>
  Number(getBuildingLevel(planet, 'SINGULARITY') >= SINGULARITY_DEFENSE_LEVEL) *
  SINGULARITY_DEF_BONUS;
