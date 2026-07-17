import { assign } from 'lodash-es';

import { CARDS } from '../../config/constants';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import type { Player } from '../../interfaces/player';
import type { PoolType } from '../../interfaces/pool-type';
import { chain } from '../../utils/chain';
import { getPlanetTurnSuffix } from './get-planet-turn-suffix';

export const applyCardPick = (
  state: GameState,
  player: Player,
  planet: Planet,
  type: PoolType,
  slot: number,
): void =>
  void chain(
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
