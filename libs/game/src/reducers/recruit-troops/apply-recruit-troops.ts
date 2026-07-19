import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { RecruitTroopsPayload } from '../../actions/recruit-troops';
import { hasActionCard } from '../../functions/has-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { executeRecruit } from './internal/execute-recruit';

export const applyRecruitTroops = (
  state: GameState,
  payload: RecruitTroopsPayload,
): GameState =>
  match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .when(
      () => !hasActionCard(state.players[payload.playerId], 'RECRUIT'),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clonedState) =>
          executeRecruit(clonedState, payload.playerId, payload.planetId),
        )
        .value(),
    );
