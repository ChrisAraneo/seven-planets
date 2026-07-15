import { assign, negate } from 'lodash-es';
import { chain } from '../utils/chain';
import { match } from 'ts-pattern';

import type { Action } from '../actions/action';
import { ACTION_CARDS_FROM_TURN } from '../config/constants';
import { applyStart } from '../functions/apply-start';
import { AUTO_HUMAN } from '../functions/auto-human';
import { canPickCard } from '../functions/can-pick-card';
import { getDraftOrder } from '../functions/get-draft-order';
import { log } from '../functions/log';
import { getMainPicks } from '../functions/get-main-picks';
import { getOwnedPlanets } from '../functions/get-owned-planets';
import { passSlot } from '../functions/pass-slot';
import { getPickStatus } from '../functions/get-pick-status';
import { getSeatStatus } from '../functions/get-seat-status';
import { setStatus } from '../functions/set-status';
import { getTurnOrder } from '../functions/get-turn-order';
import { turnPrelude } from '../functions/turn-prelude';
import type { EngineCursor } from '../interfaces/engine-cursor';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { applyAttackPlanet } from './attack-planet/attack-planet';
import { applyEndTurn } from './end-turn/end-turn';
import { applyMakeOffer } from './make-offer/make-offer';
import { applyMoveTroops } from './move-troops/move-troops';
import { applyPickCard } from './pick-card/pick-card';
import { applyRecruitTroops } from './recruit-troops/recruit-troops';
import { applyResolveOffer } from './resolve-offer/resolve-offer';
import { applySetPlanetLayout } from './set-planet-layout/set-planet-layout';
import { applyUseInfluence } from './use-influence/use-influence';

export const reduce = (state: GameState, action: Action): GameState =>
  chain(applyAction(state, action)).thru(advance).value();

type DraftCursor = Extract<EngineCursor, { phase: 'draft' }>;
type ActionCursor = Extract<EngineCursor, { phase: 'action' }>;

/* A cursor paired with the state it sits on — the value the draft/action
   step ladders match over. */
type DraftFrame = { state: GameState; cursor: DraftCursor };
type ActionFrame = { state: GameState; cursor: ActionCursor };
type SeatFrame = DraftFrame | ActionFrame;

function applyAction(state: GameState, action: Action): GameState {
  return match(action)
    .with({ kind: 'START' }, () => applyStart(state))
    .with({ kind: 'PICK_CARD' }, ({ playerId, index }) =>
      applyPickCard(state, { playerId, index }),
    )
    .with({ kind: 'END_TURN' }, ({ payload }) => applyEndTurn(state, payload))
    .with({ kind: 'ATTACK_PLANET' }, ({ payload }) =>
      applyAttackPlanet(state, payload),
    )
    .with({ kind: 'MOVE_TROOPS' }, ({ payload }) =>
      applyMoveTroops(state, payload),
    )
    .with({ kind: 'RECRUIT_TROOPS' }, ({ payload }) =>
      applyRecruitTroops(state, payload),
    )
    .with({ kind: 'USE_INFLUENCE' }, ({ payload }) =>
      applyUseInfluence(state, payload),
    )
    .with({ kind: 'MAKE_OFFER' }, ({ payload }) =>
      applyMakeOffer(state, payload),
    )
    .with({ kind: 'RESOLVE_OFFER' }, ({ payload }) =>
      applyResolveOffer(state, payload),
    )
    .with({ kind: 'SET_PLANET_LAYOUT' }, ({ payload }) =>
      applySetPlanetLayout(state, payload),
    )
    .exhaustive();
}

/* THE ENGINE. Advance the game from `state` until it next needs player
   input: run turn preludes, draft passes and phase transitions, then park by
   raising `awaitingPick`/`awaitingAction` and bumping `inputSeq` exactly once.
   The cursor on the state is the engine's whole position — each recursive
   step performs one small cursor transition and hands the state straight
   back to advance, so no suspended call stack outlives an emission and any
   emitted snapshot can resume the game by itself.

   Mutates its argument in place: each reducer branch (applyPickCard,
   applyEndTurn, ...) hands it a private clone for every legal intent, and
   every path that reaches a mutation goes through a legal apply. A state
   that is already parked, unstarted or finished advances to itself,
   untouched — so an illegal intent's no-op state passes through unharmed. */
export function advance(state: GameState): GameState {
  return (
    match(state)
      .when(isSettled, (state) => state)
      /* Game over settles the cursor wherever it is — including mid-draft,
       where draftPlanetId is deliberately left as-is (§ the old early return). */
      .when((state) => state.over !== null, finishGame)
      .otherwise((state) => advance(stepCursor(state)))
  );
}

/* Parked on player input, unstarted or finished: advance leaves it untouched. */
function isSettled(state: GameState): boolean {
  return (
    state.awaitingPick ||
    state.awaitingAction ||
    state.cursor.phase === 'setup' ||
    state.cursor.phase === 'done'
  );
}

/* One cursor transition. The settled check above guarantees the cursor is
   mid-game here; the otherwise arm is unreachable. */
function stepCursor(state: GameState): GameState {
  return match(state.cursor)
    .with({ phase: 'draft' }, (cursor) => draftStep(state, cursor))
    .with({ phase: 'action' }, (cursor) => actionStep(state, cursor))
    .otherwise(() => state);
}

/* One draft transition: move to the next seat/slot, enter a slot, pass, or
   park a pick. The seat queue is the draft-order snapshot; a seat's owned
   planets are re-resolved live per slot (conquests mid-draft change what a
   seat drafts for). */
function draftStep(state: GameState, cursor: DraftCursor): GameState {
  return (
    match({ state, cursor })
      .when(isQueueExhausted, ({ state }) => finishDraft(state))
      .when(isSeatFinished, nextSeat)
      .when(isSlotFinished, nextSlot)
      .when(isSlotUnentered, enterSlot)
      // Pass slots do not park: log and move on.
      .when(negate(hasPickableCard), passAndSkipSlot)
      .otherwise(parkPick)
  );
}

function isQueueExhausted({ cursor }: SeatFrame): boolean {
  return cursor.seatIdx >= cursor.seatQueue.length;
}

function seatPlayer({ state, cursor }: SeatFrame): Player {
  return state.players[cursor.seatQueue[cursor.seatIdx]];
}

/* Skipped, dead or out of owned planets: this seat drafts no further slots. */
function isSeatFinished(frame: DraftFrame): boolean {
  return chain(seatPlayer(frame))
    .thru(
      (player) =>
        player.skippedNow ||
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

/** picksTotal stays -1 until enterSlot captures it. */
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

/* getMainPicks for the seat's first slot; every later slot gets one pick. */
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

/* PARK: raise awaitingPick and bump inputSeq — the emission that carries
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
            cursor.picksTotal,
            cursor.pick,
            cursor.slot,
            isHumanControlled(player),
          ),
        ),
      ),
    )
    .thru(() =>
      assign(state, { awaitingPick: true, inputSeq: state.inputSeq + 1 }),
    )
    .value();
}

/* The draft ran to completion (every seat settled — not a game-over abort):
   only now does the draft-planet marker reset. */
function finishDraft(state: GameState): GameState {
  return chain(assign(state, { draftPlanetId: -1 }))
    .thru((state) =>
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

/* One action-phase transition: skip dead/paralysed seats, park the next
   seat's action turn, or — with the queue exhausted — start the next turn. */
function actionStep(state: GameState, cursor: ActionCursor): GameState {
  return match({ state, cursor })
    .when(isQueueExhausted, ({ state }) => startNextTurn(state))
    .when(isSeatSittingOut, skipSeat)
    .otherwise(parkAction);
}

/* Dead or paralysed seats take no action turn. */
function isSeatSittingOut(frame: ActionFrame): boolean {
  return chain(seatPlayer(frame))
    .thru((player) => !player.isAlive || player.skippedNow)
    .value();
}

function skipSeat({ state, cursor }: ActionFrame): GameState {
  return assign(state, {
    cursor: { ...cursor, seatIdx: cursor.seatIdx + 1 },
  });
}

/* PARK: raise awaitingAction and bump inputSeq — answered by `endTurn`. */
function parkAction(frame: ActionFrame): GameState {
  return chain(seatPlayer(frame))
    .tap((player) => assign(frame.state, { activeId: player.id }))
    .tap((player) =>
      assign(frame.state, setStatus(frame.state, getSeatStatus(player))),
    )
    .thru(() =>
      assign(frame.state, {
        awaitingAction: true,
        inputSeq: frame.state.inputSeq + 1,
      }),
    )
    .value();
}

// The turn cap stops the game BEFORE a new prelude starts (never mid-turn).
function startNextTurn(state: GameState): GameState {
  return match(state)
    .when((state) => state.turn >= state.maxTurns, finishGame)
    .otherwise((state) =>
      chain(state)
        .tap(turnPrelude)
        .thru((state) =>
          assign(state, { phase: 'draft', cursor: getDraftCursor(state) }),
        )
        .value(),
    );
}

function getDraftCursor(state: GameState): DraftCursor {
  return {
    phase: 'draft',
    seatQueue: getDraftOrder(state).map((player) => player.id),
    seatIdx: 0,
    slot: 0,
    pick: 0,
    picksTotal: -1,
  };
}

/* Terminal settle (game over or turn cap): clear the parked-input flags and
   the seat marker; the cursor rests at 'done'. */
function finishGame(state: GameState): GameState {
  return assign(state, {
    awaitingPick: false,
    awaitingAction: false,
    activeId: -1,
    cursor: getDoneCursor(),
  });
}

function getDoneCursor(): EngineCursor {
  return { phase: 'done' };
}

function isHumanControlled(player: Player): boolean {
  return player.isHuman && !AUTO_HUMAN;
}
