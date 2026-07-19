import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import type { Player } from '../../interfaces/player';

// TODO: OK
export const getFirstOwnedPlanet = (
  state: GameState,
  player: Player,
): Planet | null =>
  state.planets.find((planet) => planet.ownerId === player.id) ?? null;
