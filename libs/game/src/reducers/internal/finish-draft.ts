import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { ACTION_CARDS_FROM_TURN } from '../../config/constants';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { beginActionPhase } from './begin-action-phase';
import { skipActionPhase } from './skip-action-phase';

export const finishDraft = (state: GameState): GameState =>
  chain(assign(state, { draftPlanetId: -1 }))
    .thru(() =>
      match(state.turn < ACTION_CARDS_FROM_TURN)
        .with(true, () => skipActionPhase(state))
        .otherwise(() => beginActionPhase(state)),
    )
    .value();
