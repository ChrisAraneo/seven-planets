import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MoveTroopsPayload } from '../../actions/move-troops';
import { hasActionCard } from '../../functions/has-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { executeMove } from './internal/execute-move';

export const applyMoveTroops = (
  state: GameState,
  payload: MoveTroopsPayload,
): GameState =>
  match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .when(
      () => !hasActionCard(state.players[payload.playerId], 'MOVE'),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clonedState) => executeMove(clonedState, payload))
        .value(),
    );
