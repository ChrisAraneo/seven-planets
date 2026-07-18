import { values } from 'lodash-es';

import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { getOwnedPlanets } from './get-owned-planets';

// TODO: OK
export const getBuildingCount = (state: GameState, player: Player): number =>
  getOwnedPlanets(state, player).reduce(
    (sum, planet) =>
      sum +
      values(planet.buildings).reduce((first, building) => first + building, 0),
    0,
  );
