import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MakeOfferPayload } from '../../../actions/make-offer/make-offer';
import { CARDS } from '../../../config/constants';
import { isResourceType } from '../../../functions/is-resource-type';
import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';
import type { Player } from '../../../interfaces/player';

export const logSeeking = (
  state: GameState,
  player: Player,
  gets: MakeOfferPayload['gets'],
): GameState =>
  match(Object.keys(gets)[0])
    .when(
      (wantKey) => isResourceType(wantKey),
      (wantKey) =>
        assign(
          state,
          log(
            state,
            `📡 ${player.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
            'trade',
          ),
        ),
    )
    .otherwise(() => state);
