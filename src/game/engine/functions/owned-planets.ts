import type { GameState, Planet, Player } from '@/game/types';

export function ownedPlanets(state: GameState, p: Player): Planet[] {
  return p.planets.map((id) => state.planets[id]);
}
