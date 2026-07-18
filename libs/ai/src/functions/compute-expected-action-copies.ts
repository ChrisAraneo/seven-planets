import type { ActionType } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import {
  ACTION_CARDS_FROM_TURN,
  CARDS,
  MOVE_CARDS_FROM_TURN,
} from '@seven-planets/game';
import { sumBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';

export const computeExpectedActionCopies = (actionType: ActionType): number =>
  match(getTurn())
    .when(
      (turn) => turn < ACTION_CARDS_FROM_TURN,
      () => 0,
    )
    .otherwise((turn) =>
      chain(
        match(turn >= MOVE_CARDS_FROM_TURN)
          .with(true, (): ActionType[] => [
            'ATTACK',
            'RECRUIT',
            'TRADE',
            'MOVE',
          ])
          .otherwise((): ActionType[] => ['ATTACK', 'RECRUIT', 'TRADE']),
      )
        .thru((actionTypes) =>
          match(actionTypes.includes(actionType))
            .with(false, () => 0)
            .otherwise(
              () =>
                (6 * CARDS[actionType].weight) /
                sumBy(
                  actionTypes,
                  (eachActionType) => CARDS[eachActionType].weight,
                ),
            ),
        )
        .value(),
    );
