import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { UseInfluencePayload } from '../../actions/use-influence';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { playInfluence } from './internal/play-influence';

export const applyUseInfluence = (
  state: GameState,
  payload: UseInfluencePayload,
): GameState =>
  match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((cl1) =>
          playInfluence(
            cl1,
            payload.playerId,
            payload.type,
            payload.options ?? {},
          ),
        )
        .value(),
    );
