import { assign, fromPairs, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import {
  CARD_TYPES,
  CONQUEST_TRUCE,
  formatCards,
  INFLUENCE_TYPES,
} from '../../config/constants';
import { checkWin } from '../../functions/check-win';
import { emitEffect } from '../../functions/emit-effect';
import { getHandSize } from '../../functions/get-hand-size';
import { getOwnedPlanets } from '../../functions/get-owned-planets';
import { log } from '../../functions/log';
import { stealCards } from '../../functions/steal-cards';
import type { GameState } from '../../interfaces/game-state';
import type { Hand } from '../../interfaces/hand';
import { chain } from '../../utils/chain';

// Loot caps: a fleeing defender loses at most 5 cards, a wiped-out one 6.
const FLEE_LOOT_CAP = 5;
const ELIMINATION_LOOT_CAP = 6;

export function conquerPlanet(
  state: GameState,
  attackerId: number,
  targetId: number,
  garrison: number,
): void {
  return void chain({
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .tap(({ target }) =>
      assign(target, {
        ownerId: attackerId,
        troops: garrison,
        protectedUntil: state.turn + CONQUEST_TRUCE,
      }),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'floatText',
          planetId: targetId,
          text: 'CONQUERED!',
          color: '#ff9e3d',
        }),
      ),
    )
    .tap(({ target }) =>
      assign(
        state,
        log(
          state,
          `🏴 ${state.players[attackerId].name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        ),
      ),
    )
    .tap(({ defenderId }) => resolveDefenderFate(state, attackerId, defenderId))
    .thru(() => assign(state, checkWin(state)))
    .value();
}

function resolveDefenderFate(
  state: GameState,
  attackerId: number,
  defenderId: number,
): void {
  return match(getOwnedPlanets(state, state.players[defenderId]).length)
    .with(0, () => eliminateDefender(state, attackerId, defenderId))
    .otherwise(() =>
      lootCards(
        state,
        defenderId,
        attackerId,
        Math.min(
          FLEE_LOOT_CAP,
          Math.ceil(getHandSize(state.players[defenderId]) / 2),
        ),
        (taken) =>
          `💰 ${state.players[attackerId].name} seizes ${formatCards(taken)} from the fleeing ${state.players[defenderId].name}!`,
      ),
    );
}

function eliminateDefender(
  state: GameState,
  attackerId: number,
  defenderId: number,
): void {
  return void chain(state)
    .tap(() =>
      lootCards(
        state,
        defenderId,
        attackerId,
        Math.min(ELIMINATION_LOOT_CAP, getHandSize(state.players[defenderId])),
        (taken) =>
          `💰 ${state.players[attackerId].name} salvages ${formatCards(taken)} from the ruins!`,
      ),
    )
    .tap(() =>
      assign(state.players[defenderId], {
        hand: {
          ...state.players[defenderId].hand,
          ...fromPairs(
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
          `☠️ ${state.players[defenderId].name} has been wiped from the galaxy!`,
          'war',
        ),
      ),
    )
    .value();
}

function lootCards(
  state: GameState,
  fromId: number,
  toId: number,
  lootN: number,
  message: (taken: Hand) => string,
): void {
  return match(lootN)
    .when((count) => count <= 0, noop)
    .otherwise(
      (count) =>
        void chain(stealCards(state, fromId, toId, count))
          .tap(({ state: looted }) => assign(state, looted))
          .tap(({ taken }) => assign(state, log(state, message(taken), 'war')))
          .value(),
    );
}
