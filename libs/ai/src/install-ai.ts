import { distinctUntilChanged, distinctUntilKeyChanged, map } from 'rxjs';

import type {
  GameState,
  InfluenceOptions,
  InfluenceType,
  Cost,
} from '@seven-planets/game';
import {
  AUTO_HUMAN,
  getGameState,
  getGameStateLastValue,
  getIsOver,
  getPlayers,
} from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { getHomePlanet } from '@seven-planets/game';
import {
  createAttackPlanetAction,
  createEndTurnAction,
  createUseInfluenceAction,
  dispatch,
  makeOffer,
  moveTroops,
  pickCard,
  recruitTroops,
  resolveOffer,
} from '@seven-planets/game';

import { getMastermindDecision } from './functions/get-mastermind-decision';
import { computeMastermindDraftPick } from './functions/compute-mastermind-draft-pick';
import { shouldAcceptTrade } from './functions/should-accept-trade';
import { getPlayerByIndex } from '../../game/src/getters/get-player-by-index';

/* =====================================================================
   The mastermind AI driver.

   The AI has no bespoke bridge into the game loop — it only SUBSCRIBES
   to the game's state stream, exactly like the effects player:

     getGameState() | distinctUntilKeyChanged('inputSeq')  → answer picks/turns
     getGameState() | map(pendingOffer) | distinct         → answer trade offers

   The engine bumps `inputSeq` and publishes a snapshot every time it
   parks awaiting the seat in play; when that seat is AI-controlled the
   subscription answers by calling the very same game actions the
   human's clicks call. The AI never mutates game state directly, and
   the game core registers no callbacks — its output is getGameState(), its
   input is the actions.

   Pacing is entirely the AI's concern (the engine never waits on time):
   in the browser the AI defers its answers with timers so its play
   reads at a human pace; headless it answers synchronously — RxJS
   subjects deliver synchronously and the engine stream's queueScheduler
   flattens the loop, so whole simulated games run without timers,
   promises or a Vue scheduler.

   The AI's private tuning memory (weights, plan cache) deliberately
   stays a plain non-reactive singleton in ./state — its hottest loops
   read it millions of times per simulated game.
   ===================================================================== */

/** Paced (timer-deferred) answers in the browser; instant headless. */
const PACED = typeof document !== 'undefined';

const TURN_START_DELAY = 350;
const BETWEEN_ACTIONS_DELAY = 320;
const PICK_DELAY = 300;

/** A seat is AI-controlled when it is not the human, or in demo mode
    (AUTO_HUMAN) when even the human proxy is driven by the AI. */
export function isAiSeat(seatId: number): boolean {
  const players = getPlayers();
  if (seatId < 0 || seatId >= players.length) {
    return false;
  }
  return !players[seatId].isHuman || AUTO_HUMAN;
}

type Decision = NonNullable<ReturnType<typeof getMastermindDecision>>;

function performDecision(playerId: number, decision: Decision): void {
  switch (decision.kind) {
    case 'influence':
      dispatch(
        createUseInfluenceAction({
          playerId,
          type: decision.type as InfluenceType,
          options: decision.options as InfluenceOptions,
        }),
      );
      return;
    case 'attack':
      dispatch(
        createAttackPlanetAction({
          playerId,
          sourceId: decision.source.id,
          targetId: decision.target.id,
          troops: decision.n,
        }),
      );
      return;
    case 'recruit':
      recruitTroops({ playerId, planetId: decision.planet.id });
      return;
    case 'move':
      moveTroops({
        playerId,
        fromId: decision.from.id,
        toId: decision.to.id,
        troops: decision.n,
      });
      return;
    case 'trade':
      makeOffer({
        playerId,
        partnerId: decision.partner.id,
        gives: decision.gives as Cost,
        gets: decision.gets as Cost,
      });
      return;
  }
}

/** The engine parked a draft pick for AI seat `playerId`: choose a pool
    card and answer with the shared pickCard action. */
function aiPickCard(playerId: number): void {
  const state = getGameStateLastValue();
  const player = state.players[playerId];
  const planet =
    state.planets[state.draftPlanetId] ?? getHomePlanet(state, player);
  const pickable = state.pool.map((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
  let index = computeMastermindDraftPick(player, planet, pickable);
  if (index < 0 || !pickable[index]) {
    // The engine only parks when something is pickable — fall back to
    // the first legal card rather than leave the draft stuck.
    index = pickable.indexOf(true);
  }
  pickCard({ playerId, index: index });
}

/** Decide and perform one action, returning false when the turn is done. */
function takeOneAction(playerId: number): boolean {
  if (getIsOver()) {
    return false;
  }

  const player = getPlayerByIndex(playerId);

  if (player === undefined) {
    return false;
  }

  const mastermindDecision = getMastermindDecision(player);

  if (!mastermindDecision) {
    return false;
  }

  performDecision(playerId, mastermindDecision);

  return true;
}

/* Headless action turns run ONE intent per emission: dispatching from
   inside a getGameState() subscriber queues the intent (queueScheduler), so the
   NEXT snapshot — the one carrying that intent's outcome — is what
   re-triggers this driver for the following decision. Deciding several
   actions off one snapshot would plan them all against stale state. The
   12-action budget is keyed to the park's inputSeq. */
const HEADLESS_ACTION_BUDGET = 12;
let headlessTurnKey = -1;
let headlessActionsLeft = 0;

function headlessTurnStep(snapshot: GameState): void {
  if (PACED || !snapshot.awaitingAction || !isAiSeat(snapshot.activeId)) {
    return;
  }
  // A trade offer is out: resume when the partner's answer is reduced.
  if (snapshot.pendingOffer) {
    return;
  }
  // The AI always ends its turn — even a game-ending action must be
  // followed by endTurn so the engine can settle the cursor to 'done'.
  if (snapshot.over) {
    dispatch(createEndTurnAction({ playerId: snapshot.activeId }));
    return;
  }
  if (snapshot.inputSeq !== headlessTurnKey) {
    headlessTurnKey = snapshot.inputSeq;
    headlessActionsLeft = HEADLESS_ACTION_BUDGET;
  }
  if (headlessActionsLeft > 0) {
    headlessActionsLeft -= 1;
    if (takeOneAction(snapshot.activeId)) {
      return;
    }
  }
  dispatch(createEndTurnAction({ playerId: snapshot.activeId }));
}

/** Browser version of the same turn, paced with timers so the AI's play
    is visible. The timers live HERE, not in the game core. */
function aiTakeTurnPaced(playerId: number, remaining = 12): void {
  setTimeout(
    () => {
      const acted = remaining > 0 && takeOneAction(playerId);
      if (acted) {
        aiTakeTurnPaced(playerId, remaining - 1);
        return;
      }
      dispatch(createEndTurnAction({ playerId }));
    },
    remaining === 12 ? TURN_START_DELAY : BETWEEN_ACTIONS_DELAY,
  );
}

/** A trade offer appeared on the state for AI seat `playerId`: judge it
    and answer with the shared resolveOffer action. */
function aiConsiderOffer(playerId: number): void {
  const state = getGameStateLastValue();
  const offer = state.pendingOffer;
  if (!offer || offer.toId !== playerId) {
    return;
  }
  const player = state.players[playerId];
  const proposer = state.players[offer.fromId];
  // pendingOffer is from the proposer's perspective; flip it to `p`'s.
  const accept = shouldAcceptTrade(player, offer.gets, offer.gives, proposer);
  resolveOffer({ playerId, accept });
}

/** The engine parked awaiting input (a snapshot with a fresh inputSeq
    arrived) — answer if the seat in play is ours. Headless action turns
    are driven by headlessTurnStep on every emission instead, so the AI
    always decides on the freshly reduced state. */
function respond(snapshot: GameState): void {
  if (snapshot.over || !isAiSeat(snapshot.activeId)) {
    return;
  }
  const seatId = snapshot.activeId;
  if (snapshot.awaitingPick) {
    if (PACED) {
      setTimeout(() => aiPickCard(seatId), PICK_DELAY);
    } else {
      aiPickCard(seatId);
    }
    return;
  }
  if (snapshot.awaitingAction && PACED) {
    aiTakeTurnPaced(seatId);
  }
}

/* ---------------------------------------------------------------------
   The subscriptions. The AI's ONLY connection to the running game — the
   engine treats AI seats exactly like the human, publishing the same
   snapshots and resumed by the same actions. Pure RxJS: no Vue, no
   reactivity, works identically in the browser and headless.
   --------------------------------------------------------------------- */
export function installAi(): void {
  // The engine parked awaiting the seat in play (pick or action turn).
  getGameState().pipe(distinctUntilKeyChanged('inputSeq')).subscribe(respond);

  // A trade offer awaits its target seat's answer. Subscribed BEFORE the
  // headless turn driver so the answer is queued (and thus reduced) ahead
  // of the offerer's next decision.
  getGameState()
    .pipe(
      map((snapshot) => snapshot.pendingOffer),
      distinctUntilChanged(),
    )
    .subscribe((offer) => {
      if (offer && isAiSeat(offer.toId)) {
        aiConsiderOffer(offer.toId);
      }
    });

  // Headless action turns: one intent per emission (see headlessTurnStep).
  getGameState().subscribe(headlessTurnStep);
}
