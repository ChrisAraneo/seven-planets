import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { hasActionCard } from '../functions/has-action-card';
import { setBusy } from '../functions/set-busy';
import type { GameState } from '../interfaces/game-state';
import { hasBuilding } from '../functions/has-building';
import { log } from '../functions/log';
import { pluralSuffix } from '../functions/plural-suffix';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import { NO_PRESENTATION } from '../config/constants';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  troops: number;
}

export async function moveTroops(
  payload: MoveTroopsPayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return match(cloneDeep(getGameState()))
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      noop,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'MOVE'),
      noop,
    )
    .otherwise((state) =>
      chain(assign(state, setBusy(state, true)))
        .thru((state) =>
          executeMove(state, payload, hooks)
            // The busy flag must clear whether the move resolves or rejects.
            .finally(() => assign(state, setBusy(state, false)))
            .then(() => setGameState(state)),
        )
        .value(),
    );
}

// Applies pure engine results onto the private clone via assign so the
// object identity (and the caller's `state` reference) stays stable.
async function executeMove(
  state: GameState,
  { playerId, fromId, toId, troops }: MoveTroopsPayload,
  hooks: PresentationHooks,
): Promise<void> {
  return match(hasBuilding(state, state.players[playerId], 'SPACEPORT'))
    .with(false, async (): Promise<void> => undefined)
    .otherwise(() =>
      chain(assign(state, spendActionCard(state, playerId, 'MOVE')))
        .tap((state) =>
          assign(state.planets[fromId], {
            troops: state.planets[fromId].troops - troops,
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
        .thru((state) =>
          hooks
            .rocket(
              state.planets[fromId],
              state.planets[toId],
              state.players[playerId].color,
            )
            .then(() =>
              assign(state.planets[toId], {
                troops: state.planets[toId].troops + troops,
              }),
            )
            .then(() =>
              hooks.floatText(state.planets[toId], `+${troops}🪖`, '#7fd9ff'),
            ),
        )
        .value(),
    );
}
