import type { InfluenceOpts, InfluenceType, Cost } from '@seven-planets/game';
import type { InputRequest } from '@seven-planets/game';
import { AUTO_HUMAN } from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { homePlanet } from '@seven-planets/game';
import { getGameState } from '@seven-planets/game';
import { setInputListener } from '@seven-planets/game';
import { setPendingOfferCallback } from '@seven-planets/game';
import {
  attackPlanet,
  endTurn,
  makeOffer,
  moveTroops,
  pickCard,
  recruitTroops,
  resolveOffer,
  useInfluence,
} from '@seven-planets/game';

import { mastermindAction } from './functions/mastermind-action';
import { mastermindDraftPick } from './functions/mastermind-draft-pick';
import { shouldAcceptTrade } from './functions/should-accept-trade';

/* =====================================================================
   The mastermind AI driver.

   The AI has no bespoke bridge into the game loop. installAi() registers
   as the engine's input listener: whenever the engine suspends awaiting
   a seat that the AI controls — a draft pick or an action turn — the
   listener answers by calling the very same game actions the human's
   clicks call. The AI never mutates game state directly.

   Pacing is entirely the AI's concern (the engine never waits on time):
   in the browser the AI defers its answers with timers so its play reads
   at a human pace; headless (no DOM) it answers SYNCHRONOUSLY, so whole
   simulated games complete inside one startEngine call — no promises,
   no watchers, no reactivity needed.

   The AI's private tuning memory (weights, plan cache) deliberately stays
   a plain non-reactive singleton in ./state — its hottest loops read it
   millions of times per simulated game.
   ===================================================================== */

/** Paced (timer-deferred) answers in the browser; instant headless. */
const PACED = typeof document !== 'undefined';

const TURN_START_DELAY = 350;
const BETWEEN_ACTIONS_DELAY = 320;
const PICK_DELAY = 300;

/** A seat is AI-controlled when it is not the human, or in demo mode
    (AUTO_HUMAN) when even the human proxy is driven by the AI. */
export function isAiSeat(seatId: number): boolean {
  const players = getGameState().players;
  if (seatId < 0 || seatId >= players.length) {
    return false;
  }
  return !players[seatId].isHuman || AUTO_HUMAN;
}

type Decision = NonNullable<ReturnType<typeof mastermindAction>>;

function performDecision(playerId: number, decision: Decision): void {
  switch (decision.kind) {
    case 'influence':
      useInfluence({
        playerId,
        type: decision.type as InfluenceType,
        opts: decision.opts as InfluenceOpts,
      });
      return;
    case 'attack':
      attackPlanet({
        playerId,
        sourceId: decision.source.id,
        targetId: decision.target.id,
        troops: decision.n,
      });
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

/** The engine suspended on a draft pick for AI seat `playerId`: choose a
    pool card and answer with the shared pickCard action. */
function aiPickCard(playerId: number): void {
  const state = getGameState();
  const player = state.players[playerId];
  const planet =
    state.planets[state.draftPlanetId] ?? homePlanet(state, player);
  const pickable = state.pool.map((poolType) =>
    canPickCard(state, player, poolType, planet),
  );
  let index = mastermindDraftPick(player, planet, pickable);
  if (index < 0 || !pickable[index]) {
    // The engine only suspends when something is pickable — fall back to
    // the first legal card rather than leave the draft stuck.
    index = pickable.indexOf(true);
  }
  pickCard({ playerId, idx: index });
}

/** Decide and perform one action, returning false when the turn is done. */
function takeOneAction(playerId: number): boolean {
  if (getGameState().over) {
    return false;
  }
  const player = getGameState().players[playerId];
  const mastermindDecision = mastermindAction(player);
  if (!mastermindDecision) {
    return false;
  }
  performDecision(playerId, mastermindDecision);
  return true;
}

/** The engine suspended on an action turn for AI seat `playerId`:
    perform up to 12 actions, then end the turn to resume the engine. */
function aiTakeTurnNow(playerId: number): void {
  for (let index = 0; index < 12; index++) {
    if (!takeOneAction(playerId)) {
      break;
    }
  }
  endTurn({ playerId });
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
      endTurn({ playerId });
    },
    remaining === 12 ? TURN_START_DELAY : BETWEEN_ACTIONS_DELAY,
  );
}

/** A trade offer is pending for AI seat `playerId`: judge it and answer
    with the shared resolveOffer action. */
function aiConsiderOffer(playerId: number): void {
  const state = getGameState();
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

/** The engine suspended awaiting input — answer if the seat is ours. */
function respond(request: InputRequest): void {
  const state = getGameState();
  if (state.over || !isAiSeat(state.activeId)) {
    return;
  }
  const seatId = state.activeId;
  if (request.kind === 'pick') {
    if (PACED) {
      setTimeout(() => aiPickCard(seatId), PICK_DELAY);
    } else {
      aiPickCard(seatId);
    }
    return;
  }
  if (PACED) {
    aiTakeTurnPaced(seatId);
  } else {
    aiTakeTurnNow(seatId);
  }
}

/* ---------------------------------------------------------------------
   The listener. Registered once as the engine's input listener; fires
   after every engine suspension. This is the AI's ONLY connection to
   the running game — the engine treats AI seats exactly like the human,
   raising the same flags and resumed by the same actions. Works on raw
   (non-reactive) headless states: no Vue involved.
   --------------------------------------------------------------------- */
export function installAi(): void {
  // Trade offer directed at an AI seat: respond synchronously via the
  // registered callback (makeOffer calls it right after updating state).
  setPendingOfferCallback((toId) => {
    if (isAiSeat(toId)) {
      aiConsiderOffer(toId);
    }
  });

  setInputListener(respond);
}
