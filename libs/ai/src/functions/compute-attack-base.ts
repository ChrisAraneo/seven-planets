import type { Planet } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';

export function computeAttackBase(troops: number, source: Planet): number {
  return COMBAT.attackPerTroop * troops + computeSiloBonus(source);
}
