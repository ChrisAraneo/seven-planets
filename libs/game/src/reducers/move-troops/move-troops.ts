import { assign, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MoveTroopsPayload } from '../../actions/move-troops/move-troops';
import { emitEffect } from '../../functions/emit-effect';
import { getPluralSuffix } from '../../functions/get-plural-suffix';
import { hasActionCard } from '../../functions/has-action-card';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

export function applyMoveTroops(
  state: GameState,
  payload: MoveTroopsPayload,
): GameState {
  return match(state)
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
        .tap((clone) => executeMove(clone, payload))
        .value(),
    );
}

function executeMove(
  state: GameState,
  { playerId, fromId, toId, troops }: MoveTroopsPayload,
): void {
  return match(Boolean(state.planets[fromId].buildings.SPACEPORT))
    .with(false, noop)
    .otherwise(
      () =>
        void chain(assign(state, spendActionCard(state, playerId, 'MOVE')))
          .tap(() =>
            assign(state.planets[fromId], {
              troops: state.planets[fromId].troops - troops,
            }),
          )
          .tap(() =>
            assign(state.planets[toId], {
              troops: state.planets[toId].troops + troops,
            }),
          )
          .tap(() =>
            assign(
              state,
              log(
                state,
                `🛸 ${state.players[playerId].name} redeploys ${troops} troop${getPluralSuffix(troops)} from ${state.planets[fromId].name} to ${state.planets[toId].name}`,
                'build',
              ),
            ),
          )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'rocket',
                fromId,
                toId,
                color: state.players[playerId].color,
              }),
            ),
          )
          .tap(() =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId: toId,
                text: `+${troops}🪖`,
                color: '#7fd9ff',
              }),
            ),
          )
          .value(),
    );
}
