import { assign, negate } from 'lodash-es';
import { match } from 'ts-pattern';

import { ACTION_CARDS_FROM_TURN } from '../config/constants';
import { IS_AUTO_HUMAN } from '../functions/auto-human';
import { canPickCard } from '../functions/can-pick-card';
import { getMainPicks } from '../functions/get-main-picks';
import { getOwnedPlanets } from '../functions/get-owned-planets';
import { getPickStatus } from '../functions/get-pick-status';
import { getTurnOrder } from '../functions/get-turn-order';
import { log } from '../functions/log';
import { passSlot } from '../functions/pass-slot';
import { setStatus } from '../functions/set-status';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import type { ActionCursor, DraftCursor, DraftFrame } from './seat-frame';
import { isQueueExhausted, seatPlayer } from './seat-frame';
import { startNextTurn } from './turn-flow';

export function draftStep(state: GameState, cursor: DraftCursor): GameState {
  return match({ state, cursor })
    .when(isQueueExhausted, () => finishDraft(state))
    .when(isSeatFinished, nextSeat)
    .when(isSlotFinished, nextSlot)
    .when(isSlotUnentered, enterSlot)
    .when(negate(hasPickableCard), passAndSkipSlot)
    .otherwise(parkPick);
}

function isSeatFinished(frame: DraftFrame): boolean {
  return chain(seatPlayer(frame))
    .thru(
      (player) =>
        player.isSkippedNow ||
        !player.isAlive ||
        frame.cursor.slot >= getOwnedPlanets(frame.state, player).length,
    )
    .value();
}

function isSlotFinished({ state, cursor }: DraftFrame): boolean {
  return (
    state.pool.length === 0 ||
    (cursor.picksTotal !== -1 && cursor.pick >= cursor.picksTotal)
  );
}

function isSlotUnentered({ cursor }: DraftFrame): boolean {
  return cursor.picksTotal === -1;
}

function hasPickableCard(frame: DraftFrame): boolean {
  return chain({
    player: seatPlayer(frame),
    planet: getDraftPlanet(frame.state),
  })
    .thru(({ player, planet }) =>
      frame.state.pool.some((poolType) =>
        canPickCard(frame.state, player, poolType, planet),
      ),
    )
    .value();
}

function getDraftPlanet(state: GameState): Planet {
  return state.planets[state.draftPlanetId];
}

function nextSeat({ state, cursor }: DraftFrame): GameState {
  return assign(state, {
    cursor: {
      ...cursor,
      seatIdx: cursor.seatIdx + 1,
      slot: 0,
      pick: 0,
      picksTotal: -1,
    },
  });
}

function nextSlot({ state, cursor }: DraftFrame): GameState {
  return assign(state, {
    cursor: {
      ...cursor,
      slot: cursor.slot + 1,
      pick: 0,
      picksTotal: -1,
    },
  });
}

function enterSlot(frame: DraftFrame): GameState {
  return chain(seatPlayer(frame))
    .thru((player) =>
      assign(frame.state, {
        cursor: {
          ...frame.cursor,
          pick: 0,
          picksTotal: computeSlotPicksTotal(frame, player),
        },
        activeId: player.id,
        draftPlanetId: getOwnedPlanets(frame.state, player)[frame.cursor.slot]
          .id,
      }),
    )
    .value();
}

function computeSlotPicksTotal(frame: DraftFrame, player: Player): number {
  return match(frame.cursor.slot)
    .with(0, () => getMainPicks(frame.state, player))
    .otherwise(() => 1);
}

function passAndSkipSlot(frame: DraftFrame): GameState {
  return chain(seatPlayer(frame))
    .tap((player) =>
      passSlot(
        frame.state,
        player,
        getDraftPlanet(frame.state),
        isHumanControlled(player),
      ),
    )
    .thru(() => nextSlot(frame))
    .value();
}

function parkPick({ state, cursor }: DraftFrame): GameState {
  return chain(seatPlayer({ state, cursor }))
    .tap((player) =>
      assign(
        state,
        setStatus(
          state,
          getPickStatus(
            state,
            player.id,
            state.draftPlanetId,
            {
              picks: cursor.picksTotal,
              counter: cursor.pick,
              slot: cursor.slot,
            },
            isHumanControlled(player),
          ),
        ),
      ),
    )
    .thru(() =>
      assign(state, { isAwaitingPick: true, inputSeq: state.inputSeq + 1 }),
    )
    .value();
}

function finishDraft(state: GameState): GameState {
  return chain(assign(state, { draftPlanetId: -1 }))
    .thru(() =>
      match(state.turn < ACTION_CARDS_FROM_TURN)
        .with(true, () => skipActionPhase(state))
        .otherwise(() => beginActionPhase(state)),
    )
    .value();
}

function skipActionPhase(state: GameState): GameState {
  return chain(
    assign(
      state,
      log(
        state,
        `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
        'sys',
      ),
    ),
  )
    .thru(startNextTurn)
    .value();
}

function beginActionPhase(state: GameState): GameState {
  return assign(state, { phase: 'action', cursor: getActionCursor(state) });
}

function getActionCursor(state: GameState): ActionCursor {
  return {
    phase: 'action',
    seatQueue: getTurnOrder(state).map((player) => player.id),
    seatIdx: 0,
  };
}

export function isHumanControlled(player: Player): boolean {
  return player.isHuman && !IS_AUTO_HUMAN;
}
