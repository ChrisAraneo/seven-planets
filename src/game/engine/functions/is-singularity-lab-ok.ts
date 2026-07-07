// A Singularity of level L needs a Research Lab of level L on the same planet —

import { maxLevel } from '@/game/constants';
import type { Planet } from '@/game/types';

// Except the level-4 apex, which a maxed Lab (its own ceiling) satisfies.
export function isSingularityLabOk(planet: Planet, nextLevel: number): boolean {
  return (planet.buildings.LAB || 0) >= Math.min(nextLevel, maxLevel('LAB'));
}
