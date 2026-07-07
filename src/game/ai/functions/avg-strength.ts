import type { GameState } from '@/game/types';
import { alive } from './alive';
import { playerStrength } from './player-strength';

export function avgStrength(s: GameState): number {
  const all = alive(s).map((x) => playerStrength(s, x));
  return all.reduce((a, b) => a + b, 0) / (all.length || 1);
}
