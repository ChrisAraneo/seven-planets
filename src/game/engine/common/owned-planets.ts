import type { GameState, Planet, Player } from '@/game/types';

// TODO: Is it working properly?

export function ownedPlanets(state: GameState, player: Player): Planet[] {
  return player.planets.map((index) => state.planets[index]);
}
