import { COMBAT } from '@/game/constants';
import type { Planet } from '@/game/types';
import { siloBonus } from '@/game/shared/silo-bonus';

export function attackBaseOf(n: number, source: Planet): number {
  return COMBAT.attackPerTroop * n + siloBonus(source);
}
