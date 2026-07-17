import { assign, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { AttackPlanetPayload } from '../../actions/attack-planet';
import {
  choice,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  TAUNTS,
} from '../../config/constants';
import { emitEffect } from '../../functions/emit-effect';
import { getOwnedPlanets } from '../../functions/get-owned-planets';
import { hasActionCard } from '../../functions/has-action-card';
import { isUnderTruce } from '../../functions/is-under-truce';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { resolveBattle } from './resolve-battle';

// How often a non-human attacker fires off a taunt line.
const TAUNT_CHANCE = 0.4;

/* Reducer branch. Resolves the whole attack SYNCHRONOUSLY on a private
   clone: the returned state carries the outcome. The rocket flight /
   explosion / banners are emitted as effect events on the state — the
   presentation layer plays them in response. Illegal intents reduce to the
   unchanged state. */
export function applyAttackPlanet(
  state: GameState,
  payload: AttackPlanetPayload,
): GameState {
  return match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .when(
      () => !hasActionCard(state.players[payload.playerId], 'ATTACK'),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clone) => doAttack(clone, payload))
        .value(),
    );
}

function doAttack(
  state: GameState,
  { playerId: attackerId, sourceId, targetId, troops }: AttackPlanetPayload,
): void {
  return match({
    source: state.planets[sourceId],
    target: state.planets[targetId],
  })
    .when(
      // Freshly conquered planets cannot be attacked
      ({ target }) => isUnderTruce(target),
      noop,
    )
    .when(
      // No silo, no rockets
      ({ source }) => !source.buildings.SILO,
      noop,
    )
    .otherwise(
      ({ source }) =>
        void chain(state)
          .tap(() => breakPacifistVow(state, attackerId))
          .thru(() =>
            assign(state, spendActionCard(state, attackerId, 'ATTACK')),
          )
          // Resets the pacifist countdown
          .tap(() =>
            assign(state.players[attackerId], {
              lastAttackTurn: state.turn,
            }),
          )
          .tap(() => assign(source, { troops: source.troops - troops }))
          .tap(() =>
            announceLaunch(state, attackerId, sourceId, targetId, troops),
          )
          .tap(() => maybeTaunt(state, attackerId))
          .tap(() =>
            resolveBattle(state, attackerId, sourceId, targetId, troops),
          )
          .value(),
    );
}

function announceLaunch(
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  troops: number,
): void {
  return void chain(state)
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🚀 ${state.players[attackerId].name} launches a rocket with ${troops} troops from ${state.planets[sourceId].name} at ${state.planets[targetId].name} (${state.players[state.planets[targetId].ownerId].name})!`,
          'war',
        ),
      ),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'rocket',
          fromId: sourceId,
          toId: targetId,
          color: state.players[attackerId].color,
        }),
      ),
    )
    .value();
}

// Breaking the vow: a PACIFIST may attack, but doing so permanently strips the
// Status and its bonuses — and hasForfeitedPacifism bars them from ever regaining it.
function breakPacifistVow(state: GameState, attackerId: number): void {
  return match(state.players[attackerId].hasPacifistStatus)
    .with(
      true,
      () =>
        void chain(
          assign(state.players[attackerId], {
            hasPacifistStatus: false,
            hasForfeitedPacifism: true,
          }),
        )
          .thru(() =>
            assign(
              state,
              log(
                state,
                `⚔️ ${state.players[attackerId].name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are gone for good.`,
                'war',
              ),
            ),
          )
          .tap(() =>
            getOwnedPlanets(state, state.players[attackerId]).forEach(
              (planet) =>
                assign(
                  state,
                  emitEffect(state, {
                    kind: 'floatText',
                    planetId: planet.id,
                    text: '⚔️ VOW BROKEN',
                    color: '#ff6b6b',
                  }),
                ),
            ),
          )
          .value(),
    )
    .otherwise(noop);
}

function maybeTaunt(state: GameState, attackerId: number): void {
  return match(
    !state.players[attackerId].isHuman && Math.random() < TAUNT_CHANCE,
  )
    .with(
      true,
      () =>
        void assign(
          state,
          log(
            state,
            `   ${state.players[attackerId].name}: ${choice(TAUNTS)}`,
            'war',
          ),
        ),
    )
    .otherwise(noop);
}
