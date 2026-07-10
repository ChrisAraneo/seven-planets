import type { Player } from '@/game/types';

// Has this player earned permanent PACIFIST status (no attacks for PACIFIST_TURNS)?
export function isPacifist(p: Player): boolean {
  return p.pacifistStatus;
}
