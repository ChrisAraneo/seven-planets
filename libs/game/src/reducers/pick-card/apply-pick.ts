import { match } from 'ts-pattern';

import { isBuildingType } from '../../functions/is-building-type';
import { isInfluenceType } from '../../functions/is-influence-type';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { applyBuildingPick } from './apply-building-pick';
import { applyCardPick } from './apply-card-pick';
import { applyInfluencePick } from './apply-influence-pick';

export const applyPick = (
  state: GameState,
  index: number,
  seatId: number,
  slot: number,
): void =>
  void chain({
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
