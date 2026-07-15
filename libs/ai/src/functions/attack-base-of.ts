import { COMBAT } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function attackBaseOf(count: number, source: Planet): number {
  return COMBAT.attackPerTroop * count + computeSiloBonus(source);
}
