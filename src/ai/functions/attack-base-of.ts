import { COMBAT } from '@/game/config/constants';
import { siloBonus } from '@/game/functions/silo-bonus';
import type { Planet } from '@/game/types';

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}
