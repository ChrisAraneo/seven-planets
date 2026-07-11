import { watch } from 'vue';

import { sleep } from '@seven-planets/game';
import type { InfluenceOpts, InfluenceType, Cost } from '@seven-planets/game';
import { AUTO_HUMAN } from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { homePlanet } from '@seven-planets/game';
import { getGameState } from '@seven-planets/game';
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

   The AI has no bespoke bridge into the game loop. installAi() LISTENS
   to the live game state (Vue reactivity — no store involved): whenever
   the loop parks awaiting a seat that the AI controls — a draft pick,
   an action turn, or a trade offer — the matching handler fires and
   answers by calling the very same game actions the human's clicks
   call. The AI never mutates game state directly.

   The AI's private tuning memory (weights, plan cache) deliberately stays
   a plain non-reactive singleton in ./state — its hottest loops read it
   millions of times per simulated game.
   ===================================================================== */

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

async function performDecision(playerId: number, d: Decision): Promise<void> {
  switch (d.kind) {
    case 'influence':
      await useInfluence({
        playerId,
        type: d.type as InfluenceType,
        opts: d.opts as InfluenceOpts,
      });
      return;
    case 'attack':
      await attackPlanet({
        playerId,
        sourceId: d.source.id,
        targetId: d.target.id,
        n: d.n,
      });
      return;
    case 'recruit':
      await recruitTroops({ playerId, planetId: d.planet.id });
      return;
    case 'move':
      await moveTroops({ playerId, fromId: d.from.id, toId: d.to.id, n: d.n });
      return;
    case 'trade':
      await makeOffer({
        playerId,
        partnerId: d.partner.id,
        gives: d.gives as Cost,
        gets: d.gets as Cost,
      });
      return;
  }
}

/** The loop parked a draft pick for AI seat `playerId`: choose a pool
    card and answer with the shared pickCard action. */
async function aiPickCard(playerId: number): Promise<void> {
  const state = getGameState();
  const p = state.players[playerId];
  const planet = state.planets[state.draftPlanetId] ?? homePlanet(state, p);
  const pickable = state.pool.map((t) => canPickCard(state, p, t, planet));
  let idx = mastermindDraftPick(p, planet, pickable);
  if (idx < 0 || !pickable[idx]) {
    // The loop only parks when something is pickable — fall back to the
    // first legal card rather than leave the draft stuck.
    idx = pickable.indexOf(true);
  }
  await pickCard({ playerId, idx });
}

/** The loop parked an action turn for AI seat `playerId`: decide and
    perform one action at a time, then end the turn to unpark the loop. */
async function aiTakeTurn(playerId: number): Promise<void> {
  await sleep(350);
  for (let i = 0; i < 12; i++) {
    if (getGameState().over) {
      break;
    }
    const p = getGameState().players[playerId];
    const d = mastermindAction(p);
    if (!d) {
      break;
    }
    await performDecision(playerId, d);
    await sleep(320);
  }
  await endTurn({ playerId });
}

/** A trade offer is parked for AI seat `playerId`: judge it and answer
    with the shared resolveOffer action. */
function aiConsiderOffer(playerId: number): void {
  const state = getGameState();
  const offer = state.pendingOffer;
  if (!offer || offer.toId !== playerId) {
    return;
  }
  const p = state.players[playerId];
  const proposer = state.players[offer.fromId];
  // pendingOffer is from the proposer's perspective; flip it to `p`'s.
  const accept = shouldAcceptTrade(p, offer.gets, offer.gives, proposer);
  resolveOffer({ playerId, accept });
}

/* ---------------------------------------------------------------------
   The listener. Watches the game's parked-input flags and, when the
   parked seat is AI-controlled, runs the matching handler. This is the
   AI's ONLY connection to the running game — the loop treats AI seats
   exactly like the human, raising the same flags and awaiting the same
   resolvers. Requires the live state to be reactive (the composition
   root installs it that way); raw headless states are never watched.
   --------------------------------------------------------------------- */
export function installAi(): void {
  const gs = () => getGameState();

  // Draft pick parked for the active seat.
  watch(
    () => (gs().awaitingPick && !gs().over ? gs().activeId : -1),
    (seatId) => {
      if (isAiSeat(seatId)) {
        void aiPickCard(seatId);
      }
    },
  );

  // Action turn parked for the active seat.
  watch(
    () => (gs().awaitingAction && !gs().over ? gs().activeId : -1),
    (seatId) => {
      if (isAiSeat(seatId)) {
        void aiTakeTurn(seatId);
      }
    },
  );

  // Trade offer parked for some seat.
  watch(
    () => gs().pendingOffer?.toId ?? -1,
    (toId) => {
      if (gs().pendingOffer && isAiSeat(toId)) {
        aiConsiderOffer(toId);
      }
    },
  );
}
