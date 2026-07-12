import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { hasActionCard } from '../functions/has-action-card';
import type { GameState } from '../interfaces/game-state';
import { emitEffect } from '../functions/emit-effect';
import { hasBuilding } from '../functions/has-building';
import { log } from '../functions/log';
import { pluralSuffix } from '../functions/plural-suffix';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  troops: number;
}

// Resolves the redeploy SYNCHRONOUSLY; the rocket flight and arrival banner
// are effect events the presentation layer plays in response.
export function moveTroops(payload: MoveTroopsPayload): void {
  return match(cloneDeep(getGameState()))
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      noop,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'MOVE'),
      noop,
    )
    .otherwise(
      (state) =>
        void chain(state)
          .tap((state) => executeMove(state, payload))
          .tap((state) => setGameState(state))
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
