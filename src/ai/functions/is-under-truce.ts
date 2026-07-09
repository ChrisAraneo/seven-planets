import { getTurn } from '@/stores/game/getters/get-turn';
import type { Planet } from '@/game/types';

export function isUnderTruce(pl: Planet): boolean {
  return getTurn() <= pl.protectedUntil;
}
