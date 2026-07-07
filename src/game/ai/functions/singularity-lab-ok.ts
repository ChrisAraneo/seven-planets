import { maxLevel } from '@/game/constants';
import type { Planet } from '@/game/types';

export function singularityLabOk(pl: Planet, nextLevel: number): boolean {
  return (pl.buildings.LAB || 0) >= Math.min(nextLevel, maxLevel('LAB'));
}
