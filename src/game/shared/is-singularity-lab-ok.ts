import { maxLevel } from '@/game/constants';
import type { Planet } from '@/game/types';

// A Singularity of level L needs a Research Lab of level L on the same planet —
// except the level-4 apex, which a maxed Lab (its own ceiling) satisfies.
export function isSingularityLabOk(pl: Planet, nextLevel: number): boolean {
  return (pl.buildings.LAB || 0) >= Math.min(nextLevel, maxLevel('LAB'));
}
