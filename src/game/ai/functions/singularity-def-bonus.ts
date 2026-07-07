import { SINGULARITY_DEF_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';

export function singularityDefBonus(pl: Planet): number {
  return (pl.buildings.SINGULARITY || 0) >= 4 ? SINGULARITY_DEF_BONUS : 0;
}
