import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './extractors/get-owned-planets';

export const computeTotalTroops = (state: GameState, player: Player): number =>
  getOwnedPlanets(state, player).reduce(
    (sum, planet) => sum + planet.troops,
    0,
  );
