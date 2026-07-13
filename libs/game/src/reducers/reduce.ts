import { assign } from 'lodash-es';
import { match } from 'ts-pattern';
import type { Action } from '../actions/action';
import { ACTION_CARDS_FROM_TURN } from '../config/constants';
import { applyStart } from '../functions/apply-start';
import { AUTO_HUMAN } from '../functions/auto-human';
import { canPickCard } from '../functions/can-pick-card';
import { draftOrder } from '../functions/draft-order';
import { log } from '../functions/log';
import { mainPicks } from '../functions/main-picks';
import { ownedPlanets } from '../functions/owned-planets';
import { passSlot } from '../functions/pass-slot';
import { pickStatus } from '../functions/pick-status';
import { seatStatus } from '../functions/seat-status';
import { setStatus } from '../functions/set-status';
import { turnOrder } from '../functions/turn-order';
import { turnPrelude } from '../functions/turn-prelude';
import type { EngineCursor } from '../interfaces/engine-cursor';
import type { GameState } from '../interfaces/game-state';
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

/* The whole game core: apply the intent's own semantics, then advance the
   game (turn preludes, draft passes, phase transitions) until it next needs
   input. getGameState() is the fold of this over the intent stream (see state.ts). */
export function reduce(state: GameState, intent: Action): GameState {
  return advance(applyIntent(state, intent));
}

type DraftCursor = Extract<EngineCursor, { phase: 'draft' }>;
type ActionCursor = Extract<EngineCursor, { phase: 'action' }>;

function applyIntent(state: GameState, intent: Action): GameState {
  return match(intent)
    .with({ kind: 'start' }, () => applyStart(state))
    .with({ kind: 'pick' }, ({ playerId, idx }) =>
      applyPickCard(state, { playerId, idx }),
    )
    .with({ kind: 'endTurn' }, ({ playerId }) =>
      applyEndTurn(state, { playerId }),
    )
    .with({ kind: 'attack' }, ({ payload }) =>
      applyAttackPlanet(state, payload),
    )
    .with({ kind: 'move' }, ({ payload }) => applyMoveTroops(state, payload))
    .with({ kind: 'recruit' }, ({ payload }) =>
      applyRecruitTroops(state, payload),
    )
    .with({ kind: 'influence' }, ({ payload }) =>
      applyUseInfluence(state, payload),
    )
    .with({ kind: 'offer' }, ({ payload }) => applyMakeOffer(state, payload))
    .with({ kind: 'resolveOffer' }, ({ payload }) =>
      applyResolveOffer(state, payload),
    )
    .with({ kind: 'layout' }, ({ payload }) =>
      applySetPlanetLayout(state, payload),
    )
    .exhaustive();
}

/* THE ENGINE. Advance the game from `state` until it next needs player
   input: run turn preludes, draft passes and phase transitions, then park by
   raising `awaitingPick`/`awaitingAction` and bumping `inputSeq` exactly once.
   The cursor on the state is the engine's whole position — each loop
   iteration performs one small cursor transition, so there is no suspended
   call stack and any emitted snapshot can resume the game by itself.

   Mutates its argument in place: apply (see apply-intent.ts) hands it a
   private clone for every legal intent, and every path that reaches a
   mutation goes through a legal apply. A state that is already parked,
   unstarted or finished advances to itself, untouched — so an illegal
   intent's no-op state passes through unharmed. */
export function advance(state: GameState): GameState {
  for (;;) {
    if (
      state.awaitingPick ||
      state.awaitingAction ||
      state.cursor.phase === 'setup' ||
      state.cursor.phase === 'done'
    ) {
      return state;
    }
    /* Game over settles the cursor wherever it is — including mid-draft,
       where draftPlanetId is deliberately left as-is (§ the old early return). */
    if (state.over) {
      return finishGame(state);
    }
    if (state.cursor.phase === 'draft') {
      draftStep(state, state.cursor);
    } else {
      actionStep(state, state.cursor);
    }
  }
}

/* One draft transition: move to the next seat/slot, enter a slot, pass, or
   park a pick. The seat queue is the draft-order snapshot; a seat's owned
   planets are re-resolved live per slot (conquests mid-draft change what a
   seat drafts for). */
function draftStep(state: GameState, cursor: DraftCursor): void {
  if (cursor.seatIdx >= cursor.seatQueue.length) {
    finishDraft(state);
    return;
  }
  const player = state.players[cursor.seatQueue[cursor.seatIdx]];
  const owned = ownedPlanets(state, player);
  if (player.skippedNow || !player.isAlive || cursor.slot >= owned.length) {
    nextSeat(state, cursor);
    return;
  }
  const slotDone = cursor.picksTotal !== -1 && cursor.pick >= cursor.picksTotal;
  if (state.pool.length === 0 || slotDone) {
    nextSlot(state, cursor);
    return;
  }
  if (cursor.picksTotal === -1) {
    enterSlot(state, cursor, player, owned[cursor.slot].id);
    return;
  }
  const planet = state.planets[state.draftPlanetId];
  const pickable = state.pool.some((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
  if (!pickable) {
    // Pass slots do not park: log and move on.
    passSlot(state, player, planet, humanControlled(player));
    nextSlot(state, cursor);
    return;
  }
  parkPick(state, cursor, player);
}

/* Slot entry: capture picksTotal once (mainPicks for slot 0, else 1) and
   point the draft at this slot's planet. */
function enterSlot(
  state: GameState,
  cursor: DraftCursor,
  player: Player,
  planetId: number,
): void {
  state.cursor = {
    ...cursor,
    pick: 0,
    picksTotal: cursor.slot === 0 ? mainPicks(state, player) : 1,
  };
  assign(state, { activeId: player.id, draftPlanetId: planetId });
}

/* PARK: raise awaitingPick and bump inputSeq — the emission that carries
   this snapshot is the whole notification; a `pick` intent answers it. */
function parkPick(state: GameState, cursor: DraftCursor, player: Player): void {
  assign(
    state,
    setStatus(
      state,
      pickStatus(
        state,
        player.id,
        state.draftPlanetId,
        cursor.picksTotal,
        cursor.pick,
        cursor.slot,
        humanControlled(player),
      ),
    ),
  );
  assign(state, { awaitingPick: true, inputSeq: state.inputSeq + 1 });
}

/* The draft ran to completion (every seat settled — not a game-over abort):
   only now does the draft-planet marker reset. */
function finishDraft(state: GameState): void {
  assign(state, { draftPlanetId: -1 });
  // Nobody can hold an action card before they exist, so skip the action phase.
  if (state.turn < ACTION_CARDS_FROM_TURN) {
    assign(
      state,
      log(
        state,
        `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
        'sys',
      ),
    );
    startNextTurn(state);
    return;
  }
  assign(state, { phase: 'action' });
  state.cursor = {
    phase: 'action',
    seatQueue: turnOrder(state).map((player) => player.id),
    seatIdx: 0,
  };
}

/* One action-phase transition: skip dead/paralysed seats, park the next
   seat's action turn, or — with the queue exhausted — start the next turn. */
function actionStep(state: GameState, cursor: ActionCursor): void {
  if (cursor.seatIdx >= cursor.seatQueue.length) {
    startNextTurn(state);
    return;
  }
  const player = state.players[cursor.seatQueue[cursor.seatIdx]];
  if (!player.isAlive || player.skippedNow) {
    state.cursor = { ...cursor, seatIdx: cursor.seatIdx + 1 };
    return;
  }
  // PARK: raise awaitingAction and bump inputSeq — answered by `endTurn`.
  assign(state, { activeId: player.id });
  assign(state, setStatus(state, seatStatus(player)));
  assign(state, { awaitingAction: true, inputSeq: state.inputSeq + 1 });
}

// The turn cap stops the game BEFORE a new prelude starts (never mid-turn).
function startNextTurn(state: GameState): void {
  if (state.turn >= state.maxTurns) {
    finishGame(state);
    return;
  }
  turnPrelude(state);
  assign(state, { phase: 'draft' });
  state.cursor = {
    phase: 'draft',
    seatQueue: draftOrder(state).map((player) => player.id),
    seatIdx: 0,
    slot: 0,
    pick: 0,
    picksTotal: -1,
  };
}

/* Terminal settle (game over or turn cap): clear the parked-input flags and
   the seat marker; the cursor rests at 'done'. */
function finishGame(state: GameState): GameState {
  assign(state, { awaitingPick: false, awaitingAction: false, activeId: -1 });
  state.cursor = { phase: 'done' };
  return state;
}

function humanControlled(player: Player): boolean {
  return player.isHuman && !AUTO_HUMAN;
}

function nextSeat(state: GameState, cursor: DraftCursor): void {
  state.cursor = {
    ...cursor,
    seatIdx: cursor.seatIdx + 1,
    slot: 0,
    pick: 0,
    picksTotal: -1,
  };
}

function nextSlot(state: GameState, cursor: DraftCursor): void {
  state.cursor = {
    ...cursor,
    slot: cursor.slot + 1,
    pick: 0,
    picksTotal: -1,
  };
}
