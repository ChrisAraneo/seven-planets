import { getMaxLevel } from '../config/constants';
import type { Planet } from '../interfaces/planet';

export function isSingularityLabOk(planet: Planet, nextLevel: number): boolean {
  return (planet.buildings.LAB || 0) >= Math.min(nextLevel, getMaxLevel('LAB'));
}
