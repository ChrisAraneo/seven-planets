import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

export function ownedPlanets(state: GameState, player: Player): Planet[] {
  return state.planets.filter((planet) => planet.ownerId === player.id);
}
