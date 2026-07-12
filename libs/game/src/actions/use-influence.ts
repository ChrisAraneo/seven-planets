import { chain, cloneDeep, noop } from 'lodash-es';
import { match, P } from 'ts-pattern';
import type { ActionType } from '../interfaces/action-type';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceOpts } from '../interfaces/influence-opts';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Player } from '../interfaces/player';

import {
  ACTION_TYPES,
  CARD_TYPES,
  CARDS,
  CONQUEST_TRUCE,
  fmtCards,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
  NO_PRESENTATION,
  PEACE_TRUCE,
  SKIP_TURNS,
} from '../config/constants';
import { influenceTarget } from '../functions/influence-target';
import { checkWin } from '../functions/check-win';
import { coupTargets } from '../functions/coup-targets';
import { handSize } from '../functions/hand-size';
import { homePlanet } from '../functions/home-planet';
import { log } from '../functions/log';
import { ownedPlanets } from '../functions/owned-planets';
import { stealCards } from '../functions/steal-cards';
import { getGameState, setGameState } from '../game-state';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

const { nullish } = P;

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}

export async function useInfluence(
  payload: UseInfluencePayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return match(cloneDeep(getGameState()))
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      noop,
    )
    .otherwise(
      (state) =>
        void chain(state)
          .tap((state) =>
            playInfluence(
              state,
              payload.playerId,
              payload.type,
              payload.opts ?? {},
              hooks,
            ),
          )
          .tap((state) => setGameState(state))
          .value(),
    );
}

// Applies pure engine results onto the private clone via Object.assign and reads
// entities by id (opts carry frozen selector clones — we use only their ids), so the
// whole play resolves consistently on the state that gets written back.
function playInfluence(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  opts: InfluenceOpts,
  hooks: PresentationHooks,
): boolean {
  return match(state.players[playerId].hand[influenceType] || 0)
    .when(
      (held) => held < 1,
      () => false,
    )
    .otherwise(() =>
      match(influenceType)
        .when(
          (influenceType) => influenceType.startsWith('SKIP_'),
          (influenceType) => playSkip(state, playerId, influenceType, hooks),
        )
        .with('STEAL_ACTION', (type) =>
          playStealAction(state, playerId, type, opts, hooks),
        )
        .with('COUP', (type) => playCoup(state, playerId, type, opts, hooks))
        .with('PEACE', (type) => playPeace(state, playerId, type))
        .otherwise(() => false),
    );
}

function playSkip(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  hooks: PresentationHooks,
): boolean {
  return match(influenceTarget(state, state.players[playerId], influenceType))
    .with(nullish, () => false)
    .otherwise((target) =>
      chain(state)
        .tap((state) => spendInfluenceCard(state, playerId, influenceType))
        .tap((state) => logPlay(state, playerId, influenceType, 'sys'))
        .tap((state) =>
          Object.assign(state.players[target.id], {
            skipTurns: state.players[target.id].skipTurns + SKIP_TURNS,
          }),
        )
        .tap((state) =>
          Object.assign(
            state,
            log(
              state,
              `⏭️ ${state.players[target.id].name} is paralysed — they skip their next ${SKIP_TURNS} turn${match(
                SKIP_TURNS,
              )
                .with(1, () => '')
                .otherwise(() => 's')}!`,
              'war',
            ),
          ),
        )
        .tap((state) =>
          hooks.floatText(
            homePlanet(state, state.players[target.id]),
            '⏭️ SKIPPED',
            '#ffb0d8',
          ),
        )
        .thru(() => true)
        .value(),
    );
}

function playStealAction(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  opts: InfluenceOpts,
  hooks: PresentationHooks,
): boolean {
  return match(stealContext(state, opts))
    .with(nullish, () => false)
    .otherwise(({ cardType, target }) =>
      chain(state)
        .tap((state) => spendInfluenceCard(state, playerId, influenceType))
        .tap((state) =>
          Object.assign(state.players[target.id].hand, {
            [cardType]: state.players[target.id].hand[cardType] - 1,
          }),
        )
        .tap((state) =>
          Object.assign(state.players[playerId].hand, {
            [cardType]: state.players[playerId].hand[cardType] + 1,
          }),
        )
        .tap((state) =>
          Object.assign(
            state,
            log(
              state,
              `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${INFLUENCE_CARDS[influenceType].name} — takes 1 ${CARDS[cardType].icon} ${CARDS[cardType].name} card from ${state.players[target.id].name}!`,
              'war',
            ),
          ),
        )
        .tap((state) =>
          hooks.floatText(
            homePlanet(state, state.players[target.id]),
            `−1${CARDS[cardType].icon}`,
            '#ffb0d8',
          ),
        )
        .thru(() => true)
        .value(),
    );
}

// The play is only legal against an alive rival holding at least one copy of a
// real action card; anything else yields no context and the play is refused.
function stealContext(
  state: GameState,
  opts: InfluenceOpts,
): { cardType: ActionType; target: Player } | undefined {
  return match({
    cardType: opts.cardType,
    target: opts.target && state.players[opts.target.id],
  })
    .when(
      ({ cardType, target }) =>
        Boolean(
          target &&
          target.isAlive &&
          cardType &&
          ACTION_TYPES.includes(cardType) &&
          (target.hand[cardType] || 0) >= 1,
        ),
      ({ cardType, target }) => ({
        cardType: cardType as ActionType,
        target: target as Player,
      }),
    )
    .otherwise(() => undefined);
}

function playCoup(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  opts: InfluenceOpts,
  hooks: PresentationHooks,
): boolean {
  return match(opts.planet && state.planets[opts.planet.id])
    .with(nullish, () => false)
    .when(
      (planet) => !coupTargets(state, state.players[playerId]).includes(planet),
      () => false,
    )
    .otherwise((planet) =>
      chain({ defId: planet.ownerId })
        .tap(() => spendInfluenceCard(state, playerId, influenceType))
        .tap(() => logPlay(state, playerId, influenceType, 'sys'))
        .tap(() =>
          Object.assign(planet, {
            ownerId: playerId,
            troops: Math.max(1, Math.floor(planet.troops / 2)), // Half disbands, the rest defect
            protectedUntil: state.turn + CONQUEST_TRUCE,
          }),
        )
        .tap(() => hooks.boom(planet))
        .tap(() => hooks.floatText(planet, '👑 COUP!', '#ffb0d8'))
        .tap(({ defId }) =>
          Object.assign(
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

function maybeToppleRegime(
  state: GameState,
  playerId: number,
  defId: number,
): void {
  return match(ownedPlanets(state, state.players[defId]).length)
    .when((owned) => owned > 0, noop)
    .otherwise(
      () =>
        void chain(state)
          .tap((state) => lootToppledRegime(state, playerId, defId))
          .tap((state) =>
            Object.assign(state.players[defId], {
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
          .tap((state) =>
            Object.assign(
              state,
              log(
                state,
                `☠️ ${state.players[defId].name} has been wiped from the galaxy — overthrown without a shot!`,
                'war',
              ),
            ),
          )
          .tap((state) => Object.assign(state, checkWin(state)))
          .value(),
    );
}

function lootToppledRegime(
  state: GameState,
  playerId: number,
  defId: number,
): void {
  return match(Math.min(6, handSize(state.players[defId])))
    .when((lootN) => lootN <= 0, noop)
    .otherwise(
      (lootN) =>
        void chain(stealCards(state, defId, playerId, lootN))
          .tap(({ state: looted }) => Object.assign(state, looted))
          .tap(({ taken }) =>
            Object.assign(
              state,
              log(
                state,
                `💰 ${state.players[playerId].name} salvages ${fmtCards(taken)} from the toppled regime!`,
                'war',
              ),
            ),
          )
          .value(),
    );
}

function playPeace(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
): boolean {
  return chain(state)
    .tap((state) => spendInfluenceCard(state, playerId, influenceType))
    .tap((state) => logPlay(state, playerId, influenceType, 'sys'))
    .tap((state) =>
      ownedPlanets(state, state.players[playerId]).forEach((planet) =>
        Object.assign(planet, {
          protectedUntil: Math.max(
            planet.protectedUntil,
            state.turn + PEACE_TRUCE,
          ),
        }),
      ),
    )
    .tap((state) =>
      Object.assign(
        state,
        log(
          state,
          `🕊️ ${state.players[playerId].name}'s planets are under truce for ${PEACE_TRUCE} turn${match(
            PEACE_TRUCE,
          )
            .with(1, () => '')
            .otherwise(() => 's')} — no attacks allowed!`,
          'sys',
        ),
      ),
    )
    .thru(() => true)
    .value();
}

function spendInfluenceCard(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
): void {
  return void Object.assign(state.players[playerId].hand, {
    [influenceType]: state.players[playerId].hand[influenceType] - 1,
  });
}

function logPlay(
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  cls: string,
): void {
  return void Object.assign(
    state,
    log(
      state,
      `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${INFLUENCE_CARDS[influenceType].name}`,
      cls,
    ),
  );
}
