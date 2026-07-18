import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { CARDS, INFLUENCE_CARDS } from '../../config/constants';
import { emitEffect } from '../../functions/emit-effect';
import { getHomePlanet } from '../../functions/get-home-planet';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceOptions } from '../../interfaces/influence-options';
import type { InfluenceType } from '../../interfaces/influence-type';
import { chain } from '../../utils/chain';
import { nullish } from '../../utils/p';
import { getStealContext } from './get-steal-context';
import { spendInfluenceCard } from './spend-influence-card';

export const playStealAction = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean =>
  match(getStealContext(state, options))
    .with(nullish, () => false)
    .otherwise(({ cardType, target }) =>
      chain(state)
        .tap(() => spendInfluenceCard(state, playerId, influenceType))
        .tap(() =>
          assign(state.players[target.id].hand, {
            [cardType]: state.players[target.id].hand[cardType] - 1,
          }),
        )
        .tap(() =>
          assign(state.players[playerId].hand, {
            [cardType]: state.players[playerId].hand[cardType] + 1,
          }),
        )
        .tap(() =>
          assign(
            state,
            log(
              state,
              `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${INFLUENCE_CARDS[influenceType].name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${state.players[target.id].name}!`,
              'war',
            ),
          ),
        )
        .tap(() =>
          assign(
            state,
            emitEffect(state, {
              kind: 'floatText',
              planetId: getHomePlanet(state, state.players[target.id]).id,
              text: `−1${CARDS[cardType].icon}`,
              color: '#ffb0d8',
            }),
          ),
        )
        .thru(() => true)
        .value(),
    );
