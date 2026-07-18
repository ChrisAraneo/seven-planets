import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MoveTroopsPayload } from '../../actions/move-troops/move-troops';
import { emitEffect } from '../../functions/emit-effect';
import { getPluralSuffix } from '../../functions/get-plural-suffix';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

const transferTroops = (
  state: GameState,
  { fromId, toId, troops }: MoveTroopsPayload,
): void =>
  void chain(
    assign(state.planets[fromId], {
      troops: state.planets[fromId].troops - troops,
    }),
  )
    .tap(() =>
      assign(state.planets[toId], {
        troops: state.planets[toId].troops + troops,
      }),
    )
    .value();

const announceMove = (
  state: GameState,
  { playerId, fromId, toId, troops }: MoveTroopsPayload,
): void =>
  void chain(
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
    .value();

export const executeMove = (
  state: GameState,
  payload: MoveTroopsPayload,
): void =>
  match(Boolean(state.planets[payload.fromId].buildings.SPACEPORT))
    .with(false, noop)
    .otherwise(
      () =>
        void chain(
          assign(state, spendActionCard(state, payload.playerId, 'MOVE')),
        )
          .tap(() => transferTroops(state, payload))
          .tap(() => announceMove(state, payload))
          .value(),
    );
