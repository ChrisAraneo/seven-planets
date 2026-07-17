import { match } from 'ts-pattern';

import { INFLUENCE_CARDS } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import type { PoolType } from '../interfaces/pool-type';
import { canPickBuilding } from './can-pick-building';
import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import { isBuildingType } from './is-building-type';
import { isInfluenceType } from './is-influence-type';

export const canPickCard = (
  state: GameState,
  player: Player,
  poolType: PoolType,
  planet: Planet | undefined,
): boolean =>
  match(poolType)
    .when(isBuildingType, (type) =>
      canPickBuilding(state, player, type, planet),
    )
    .when(
      isInfluenceType,
      (type) => player.influence >= INFLUENCE_CARDS[type].cost,
    )
    .with(
      'ATTACK',
      () =>
        hasBuilding(state, player, 'SILO') &&
        computeTotalTroops(state, player) >= 1,
    )
    .with(
      'MOVE',
      () =>
        hasBuilding(state, player, 'SPACEPORT') &&
        getOwnedPlanets(state, player).length >= 2 &&
        computeTotalTroops(state, player) >= 1,
    )
    .with('RECRUIT', () => hasBuilding(state, player, 'BARRACKS'))
    .with('TRADE', () => hasBuilding(state, player, 'EMBASSY'))
    .otherwise(() => true);
