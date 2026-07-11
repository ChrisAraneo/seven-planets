import { chain, cloneDeep, noop } from 'lodash-es';
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
  n: number;
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
      chain(Object.assign(state, setBusy(state, true)))
        .thru((s) =>
          executeMove(s, payload, hooks)
            // The busy flag must clear whether the move resolves or rejects.
            .finally(() => Object.assign(s, setBusy(s, false)))
            .then(() => setGameState(s)),
        )
        .value(),
    );
}

// Applies pure engine results onto the private clone via Object.assign so the
// object identity (and the caller's `state` reference) stays stable.
async function executeMove(
  state: GameState,
  { playerId, fromId, toId, n }: MoveTroopsPayload,
  hooks: PresentationHooks,
): Promise<void> {
  return match(hasBuilding(state, state.players[playerId], 'SPACEPORT'))
    .with(false, async (): Promise<void> => undefined)
    .otherwise(() =>
      chain(Object.assign(state, spendActionCard(state, playerId, 'MOVE')))
        .tap((s) =>
          Object.assign(s.planets[fromId], {
            troops: s.planets[fromId].troops - n,
          }),
        )
        .tap((s) =>
          Object.assign(
            s,
            log(
              s,
              `🛸 ${s.players[playerId].name} redeploys ${n} troop${pluralSuffix(n)} from ${s.planets[fromId].name} to ${s.planets[toId].name}`,
              'build',
            ),
          ),
        )
        .thru((s) =>
          hooks
            .rocket(
              s.planets[fromId],
              s.planets[toId],
              s.players[playerId].color,
            )
            .then(() =>
              Object.assign(s.planets[toId], {
                troops: s.planets[toId].troops + n,
              }),
            )
            .then(() => hooks.floatText(s.planets[toId], `+${n}🪖`, '#7fd9ff')),
        )
        .value(),
    );
}
