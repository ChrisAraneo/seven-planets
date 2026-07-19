import { assign } from 'lodash-es';

import { buildBuilding } from '../../../functions/build-building';
import type { BuildingType } from '../../../interfaces/building-type';
import type { GameState } from '../../../interfaces/game-state';
import type { Planet } from '../../../interfaces/planet';
import type { Player } from '../../../interfaces/player';

export const applyBuildingPick = (
  state: GameState,
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): void =>
  void assign(state, buildBuilding(state, player.id, planet.id, buildingType));
