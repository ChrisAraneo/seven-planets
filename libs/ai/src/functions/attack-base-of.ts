import { COMBAT } from '@seven-planets/game';
import { siloBonus } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}
