import { assign, cloneDeep, noop } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match } from 'ts-pattern';
import { hasActionCard } from '../../functions/has-action-card';
import type { GameState } from '../../interfaces/game-state';
import { emitEffect } from '../../functions/emit-effect';
import { hasBuilding } from '../../functions/has-building';
import { log } from '../../functions/log';
import { pluralSuffix } from '../../functions/plural-suffix';
import { spendActionCard } from '../../functions/spend-action-card';
import type { MoveTroopsPayload } from '../../actions/move-troops/move-troops';

/* Reducer branch. Resolves the redeploy SYNCHRONOUSLY on a private clone;
   the rocket flight and arrival banner are effect events the presentation
   layer plays in response. Illegal intents reduce to the unchanged state. */
export function applyMoveTroops(
  state: GameState,
  payload: MoveTroopsPayload,
): GameState {
  return match(state)
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      (state) => state,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'MOVE'),
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .tap((clone) => executeMove(clone, payload))
        .value(),
    );
}

// Applies pure engine results onto the private clone via assign so the
// object identity (and the caller's `state` reference) stays stable.
function executeMove(
  state: GameState,
  { playerId, fromId, toId, troops }: MoveTroopsPayload,
): void {
  return match(hasBuilding(state, state.players[playerId], 'SPACEPORT'))
    .with(false, noop)
    .otherwise(
      () =>
        void chain(assign(state, spendActionCard(state, playerId, 'MOVE')))
          .tap((state) =>
            assign(state.planets[fromId], {
              troops: state.planets[fromId].troops - troops,
            }),
          )
          .tap((state) =>
            assign(state.planets[toId], {
              troops: state.planets[toId].troops + troops,
            }),
          )
          .tap((state) =>
            assign(
              state,
              log(
                state,
                `🛸 ${state.players[playerId].name} redeploys ${troops} troop${pluralSuffix(troops)} from ${state.planets[fromId].name} to ${state.planets[toId].name}`,
                'build',
              ),
            ),
          )
          .tap((state) =>
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
          .tap((state) =>
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
