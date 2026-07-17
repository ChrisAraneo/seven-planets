import { match, P } from 'ts-pattern';

import { ACTION_TYPES } from '../../config/constants';
import type { ActionType } from '../../interfaces/action-type';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceOptions } from '../../interfaces/influence-options';
import type { Player } from '../../interfaces/player';

const { nonNullable } = P;
export const getStealContext = (
  state: GameState,
  options: InfluenceOptions,
): { cardType: ActionType; target: Player } | null =>
  match({
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
