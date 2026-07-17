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

/* One draft transition: move to the next seat/slot, enter a slot, pass, or
   park a pick. The seat queue is the draft-order snapshot; a seat's owned
   planets are re-resolved live per slot (conquests mid-draft change what a
   seat drafts for). */
export function draftStep(state: GameState, cursor: DraftCursor): GameState {
  return (
    match({ state, cursor })
      .when(isQueueExhausted, () => finishDraft(state))
      .when(isSeatFinished, nextSeat)
      .when(isSlotFinished, nextSlot)
      .when(isSlotUnentered, enterSlot)
      // Pass slots do not park: log and move on.
      .when(negate(hasPickableCard), passAndSkipSlot)
      .otherwise(parkPick)
  );
}

/* Skipped, dead or out of owned planets: this seat drafts no further slots. */
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

/* Pool empty, or the entered slot has used all its picks. */
function isSlotFinished({ state, cursor }: DraftFrame): boolean {
  return (
    state.pool.length === 0 ||
    (cursor.picksTotal !== -1 && cursor.pick >= cursor.picksTotal)
  );
}

/** PicksTotal stays -1 until enterSlot captures it. */
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

/* Slot entry: capture picksTotal once (getMainPicks for slot 0, else 1) and
   point the draft at this slot's planet. */
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

/* GetMainPicks for the seat's first slot; every later slot gets one pick. */
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

/* PARK: raise isAwaitingPick and bump inputSeq — the emission that carries
   this snapshot is the whole notification; a `pick` intent answers it. */
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

/* The draft ran to completion (every seat settled — not a game-over abort):
   only now does the draft-planet marker reset. */
function finishDraft(state: GameState): GameState {
  return chain(assign(state, { draftPlanetId: -1 }))
    .thru(() =>
      match(state.turn < ACTION_CARDS_FROM_TURN)
        .with(true, () => skipActionPhase(state))
        .otherwise(() => beginActionPhase(state)),
    )
    .value();
}

// Nobody can hold an action card before they exist, so skip the action phase.
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
