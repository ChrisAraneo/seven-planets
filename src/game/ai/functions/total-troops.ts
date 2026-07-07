import type { GameState, Player } from '@/game/types';
import { owned } from './owned';

export function totalTroops(s: GameState, p: Player): number {
  return owned(s, p).reduce((sum, pl) => sum + pl.troops, 0);
}
