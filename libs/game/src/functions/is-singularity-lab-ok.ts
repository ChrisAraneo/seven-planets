import { maxLevel } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// A Singularity of level L needs a Research Lab of level L on the same planet —
// Except the level-4 apex, which a maxed Lab (its own ceiling) satisfies.
export function isSingularityLabOk(pl: Planet, nextLevel: number): boolean {
  return (pl.buildings.LAB || 0) >= Math.min(nextLevel, maxLevel('LAB'));
}
