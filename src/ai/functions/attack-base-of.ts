import { COMBAT } from '@/game/constants';
import { siloBonus } from '@/game/shared/silo-bonus';
import type { Planet } from '@/game/types';

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}
