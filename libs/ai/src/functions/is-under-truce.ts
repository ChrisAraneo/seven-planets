import { getTurn } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function isUnderTruce(pl: Planet): boolean {
  return getTurn() <= pl.protectedUntil;
}
