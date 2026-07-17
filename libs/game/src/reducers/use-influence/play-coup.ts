import { assign, noop } from 'lodash-es';
import { match, P } from 'ts-pattern';

import {
  CARD_TYPES,
  CONQUEST_TRUCE,
  formatCards,
  INFLUENCE_TYPES,
} from '../../config/constants';
import { checkWin } from '../../functions/check-win';
import { emitEffect } from '../../functions/emit-effect';
import { getCoupTargets } from '../../functions/get-coup-targets';
import { getHandSize } from '../../functions/get-hand-size';
import { getOwnedPlanets } from '../../functions/get-owned-planets';
import { log } from '../../functions/log';
import { stealCards } from '../../functions/steal-cards';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceOptions } from '../../interfaces/influence-options';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { Planet } from '../../interfaces/planet';
import { chain } from '../../utils/chain';
import { logPlay } from './log-play';
import { spendInfluenceCard } from './spend-influence-card';

const { nullish } = P;

const TOPPLE_LOOT_CAP = 6;

export function playCoup(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean {
  return match(options.planet && state.planets[options.planet.id])
    .with(nullish, () => false)
    .when(
      (planet) =>
        !getCoupTargets(state, state.players[playerId]).includes(planet),
      () => false,
    )
    .otherwise((planet) =>
      chain({ defId: planet.ownerId })
        .tap(() => spendInfluenceCard(state, playerId, influenceType))
        .tap(() => logPlay(state, playerId, influenceType, 'sys'))
        .tap(() =>
          assign(planet, {
            ownerId: playerId,
            troops: Math.max(1, Math.floor(planet.troops / 2)),
            protectedUntil: state.turn + CONQUEST_TRUCE,
          }),
        )
        .tap(() => emitCoupEffects(state, planet))
        .tap(({ defId }) =>
          assign(
            state,
            log(
              state,
              `👑 ${planet.name} defects to ${state.players[playerId].name} — half of ${state.players[defId].name}'s garrison disbands, ${planet.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
              'war',
            ),
          ),
        )
        .tap(({ defId }) => maybeToppleRegime(state, playerId, defId))
        .thru(() => true)
        .value(),
    );
}

function emitCoupEffects(state: GameState, planet: Planet): void {
  return void chain(state)
    .tap(() =>
      assign(state, emitEffect(state, { kind: 'boom', planetId: planet.id })),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'floatText',
          planetId: planet.id,
          text: '👑 COUP!',
          color: '#ffb0d8',
        }),
      ),
    )
    .value();
}

function maybeToppleRegime(
  state: GameState,
  playerId: number,
  defId: number,
): void {
  return match(getOwnedPlanets(state, state.players[defId]).length)
    .when((owned) => owned > 0, noop)
    .otherwise(
      () =>
        void chain(state)
          .tap(() => lootToppledRegime(state, playerId, defId))
          .tap(() =>
            assign(state.players[defId], {
              hand: {
                ...state.players[defId].hand,
                ...Object.fromEntries(
                  [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [
                    cardType,
                    0,
                  ]),
                ),
              },
              isAlive: false,
            }),
          )
          .tap(() =>
            assign(
              state,
              log(
                state,
                `☠️ ${state.players[defId].name} has been wiped from the galaxy — overthrown without a shot!`,
                'war',
              ),
            ),
          )
          .tap(() => assign(state, checkWin(state)))
          .value(),
    );
}

function lootToppledRegime(
  state: GameState,
  playerId: number,
  defId: number,
): void {
  return match(Math.min(TOPPLE_LOOT_CAP, getHandSize(state.players[defId])))
    .when((lootN) => lootN <= 0, noop)
    .otherwise(
      (lootN) =>
        void chain(stealCards(state, defId, playerId, lootN))
          .tap(({ state: looted }) => assign(state, looted))
          .tap(({ taken }) =>
            assign(
              state,
              log(
                state,
                `💰 ${state.players[playerId].name} salvages ${formatCards(taken)} from the toppled regime!`,
                'war',
              ),
            ),
          )
          .value(),
    );
}
