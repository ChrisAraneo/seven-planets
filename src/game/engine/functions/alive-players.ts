import type { Player } from '@/game/types';
import { getState } from '../state';

export function alivePlayers(): Player[] {
  return getState().players.filter((p) => p.alive);
}
