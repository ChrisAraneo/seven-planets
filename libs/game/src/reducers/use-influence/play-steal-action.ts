import { assign } from 'lodash-es';
import { match, P } from 'ts-pattern';

import { ACTION_TYPES, CARDS, INFLUENCE_CARDS } from '../../config/constants';
import { emitEffect } from '../../functions/emit-effect';
import { getHomePlanet } from '../../functions/get-home-planet';
import { log } from '../../functions/log';
import type { ActionType } from '../../interfaces/action-type';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceOptions } from '../../interfaces/influence-options';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';
import { spendInfluenceCard } from './spend-influence-card';

const { nonNullable, nullish } = P;

export function playStealAction(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean {
  return match(getStealContext(state, options))
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
}

function getStealContext(
  state: GameState,
  options: InfluenceOptions,
): { cardType: ActionType; target: Player } | null {
  return match({
    cardType: options.cardType,
    target: options.target && state.players[options.target.id],
  })
    .with(
      { cardType: nonNullable, target: nonNullable },
      ({ cardType, target }) =>
        target.isAlive &&
        ACTION_TYPES.includes(cardType) &&
        (target.hand[cardType] || 0) >= 1,
      ({ cardType, target }) => ({ cardType, target }),
    )
    .otherwise(() => null);
}
