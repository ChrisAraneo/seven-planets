import type { GameState, Planet, Player } from '@/game/types';

export function owned(s: GameState, p: Player): Planet[] {
  return p.planets.map((id) => s.planets[id]);
}
