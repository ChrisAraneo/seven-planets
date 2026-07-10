import type { Player } from './player';

export interface GameOver {
  winner: Player | null;
  reason: 'conquest' | 'eliminated';
}
