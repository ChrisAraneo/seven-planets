import type { GameState, Planet, Player } from '@/game/types';

export function homePlanet(state: GameState, p: Player): Planet {
  return state.planets[p.planets[0]];
}
