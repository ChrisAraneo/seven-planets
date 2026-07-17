import type { Planet } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';

export const computeAttackBase = (troops: number, source: Planet): number =>
  COMBAT.attackPerTroop * troops + computeSiloBonus(source);
