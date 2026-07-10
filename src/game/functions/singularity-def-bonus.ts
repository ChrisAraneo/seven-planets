import { SINGULARITY_DEF_BONUS } from '@/game/config/constants';
import type { Planet } from '@/game/types';

// A level-4 Singularity warps local space into a shield: flat +8 defense.
export function singularityDefBonus(pl: Planet): number {
  return (pl.buildings.SINGULARITY || 0) >= 4 ? SINGULARITY_DEF_BONUS : 0;
}
