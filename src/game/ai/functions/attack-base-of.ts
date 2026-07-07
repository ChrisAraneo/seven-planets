import { COMBAT } from '@/game/constants';
import type { Planet } from '@/game/types';
import { siloBonus } from './silo-bonus';

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}
