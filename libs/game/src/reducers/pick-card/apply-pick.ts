import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { CARDS, INFLUENCE_CARDS } from '../../config/constants';
import { buildBuilding } from '../../functions/build-building';
import { isBuildingType } from '../../functions/is-building-type';
import { isInfluenceType } from '../../functions/is-influence-type';
import { log } from '../../functions/log';
import type { BuildingType } from '../../interfaces/building-type';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { Planet } from '../../interfaces/planet';
import type { Player } from '../../interfaces/player';
import type { PoolType } from '../../interfaces/pool-type';
import { chain } from '../../utils/chain';

export function applyPick(
  state: GameState,
  index: number,
  seatId: number,
  slot: number,
): void {
  return void chain({
    player: state.players[seatId],
    planet: state.planets[state.draftPlanetId],
    type: state.pool.splice(index, 1)[0],
  })
    .tap(({ player, planet, type }) =>
      match(type)
        .when(isBuildingType, (poolType) =>
          applyBuildingPick(state, player, planet, poolType),
        )
        .when(isInfluenceType, (poolType) =>
          applyInfluencePick(state, player, poolType),
        )
        .otherwise((poolType) =>
          applyCardPick(state, player, planet, poolType, slot),
        ),
    )
    .value();
}

// Pays cost from hand, may win the game
function applyBuildingPick(
  state: GameState,
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): void {
  return void assign(
    state,
    buildBuilding(state, player.id, planet.id, buildingType),
  );
}

function applyInfluencePick(
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
): void {
  return void chain(
    assign(player, {
      influence: player.influence - INFLUENCE_CARDS[influenceType].cost,
      hand: { ...player.hand, [influenceType]: player.hand[influenceType] + 1 },
    }),
  )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `⭐ ${player.name} drafts ${CARDS[influenceType].icon} ${CARDS[influenceType].name} (−${INFLUENCE_CARDS[influenceType].cost}⭐) — holds it for a later action turn`,
          'draft',
        ),
      ),
    )
    .value();
}

function applyCardPick(
  state: GameState,
  player: Player,
  planet: Planet,
  type: PoolType,
  slot: number,
): void {
  return void chain(
    assign(player, {
      hand: { ...player.hand, [type]: player.hand[type] + 1 },
    }),
  )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🃏 ${player.name} drafts ${CARDS[type].icon} ${CARDS[type].name}${getPlanetTurnSuffix(planet, slot)}`,
          'draft',
        ),
      ),
    )
    .value();
}

function getPlanetTurnSuffix(planet: Planet, slot: number): string {
  return match(slot)
    .when(
      (count) => count > 0,
      () => ` (${planet.name}'s turn)`,
    )
    .otherwise(() => '');
}
