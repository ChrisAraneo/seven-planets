import type { Player } from '@/game/types';
import { getState } from '../state';
import { alivePlayers } from './alive-players';

export function turnOrder(): Player[] {
  const n = getState().players.length;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    order.push(getState().players[(getState().startIdx + i) % n]);
  }
  return order.filter((p) => p.alive);
}
