import { SINGULARITY_DEF_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// A level-4 Singularity warps local space into a shield: flat +8 defense.
// Branch-free arithmetic: this sits in the AI's battle-prediction hot loop.
// The Singularity level at which the defense bonus switches on.
const SINGULARITY_DEFENSE_LEVEL = 4;

export function computeSingularityDefenseBonus(planet: Planet): number {
  return (
    Number((planet.buildings.SINGULARITY || 0) >= SINGULARITY_DEFENSE_LEVEL) *
    SINGULARITY_DEF_BONUS
  );
}
