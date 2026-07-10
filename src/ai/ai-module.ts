import type { Module, Store } from 'vuex';

import { sleep } from '@/game/hooks';
import type { InfluenceOpts, InfluenceType, Cost } from '@/game/types';
import { AUTO_HUMAN } from '@/stores/game/functions/auto-human';
import { canPickCard } from '@/stores/game/functions/can-pick-card';
import { homePlanet } from '@/stores/game/functions/home-planet';
import { getGameState } from '@/stores/game-state';

import { mastermindAction } from '@/ai/functions/mastermind-action';
import { mastermindDraftPick } from '@/ai/functions/mastermind-draft-pick';
import { shouldAcceptTrade } from '@/ai/functions/should-accept-trade';

import type { RootState } from '@/stores';

/* =====================================================================
   The mastermind AI, as a Vuex module.

   The AI no longer has a bespoke bridge into the game loop. Instead this
   module LISTENS to the game module's reactive state (see `aiPlugin`):
   whenever the loop parks awaiting a seat that the AI controls — a draft
   pick, an action turn, or a trade offer — the matching action fires and
   answers by dispatching the very same `game/*` store actions the human's
   clicks dispatch. The AI never mutates game state directly.

   The AI's private tuning memory (weights, plan cache) deliberately stays
   a plain non-reactive singleton in @/ai/state — its hottest loops read it
   millions of times per simulated game.
   ===================================================================== */

export interface AiModuleState {
  /** True while an AI seat is mid-decision (a draft pick or action turn). */
  thinking: boolean;
}

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

async function performDecision(
  dispatch: (
    type: string,
    payload: unknown,
    opts: { root: true },
  ) => Promise<unknown>,
  playerId: number,
  d: Decision,
): Promise<void> {
  switch (d.kind) {
    case 'influence':
      await dispatch(
        'game/useInfluence',
        {
          playerId,
          type: d.type as InfluenceType,
          opts: d.opts as InfluenceOpts,
        },
        { root: true },
      );
      return;
    case 'attack':
      await dispatch(
        'game/attackPlanet',
        { playerId, sourceId: d.source.id, targetId: d.target.id, n: d.n },
        { root: true },
      );
      return;
    case 'recruit':
      await dispatch(
        'game/recruitTroops',
        { playerId, planetId: d.planet.id },
        { root: true },
      );
      return;
    case 'move':
      await dispatch(
        'game/moveTroops',
        { playerId, fromId: d.from.id, toId: d.to.id, n: d.n },
        { root: true },
      );
      return;
    case 'trade':
      await dispatch(
        'game/tradeResources',
        {
          playerId,
          partnerId: d.partner.id,
          gives: d.gives as Cost,
          gets: d.gets as Cost,
        },
        { root: true },
      );
      return;
  }
}

export const ai: Module<AiModuleState, RootState> = {
  namespaced: true,

  state: () => ({ thinking: false }),

  mutations: {
    setThinking(state, v: boolean) {
      state.thinking = v;
    },
  },

  actions: {
    /** The loop parked a draft pick for AI seat `playerId`: choose a pool
        card and answer with the shared `game/pickCard` action. */
    async pickCard({ dispatch }, playerId: number) {
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
      await dispatch('game/pickCard', { playerId, idx }, { root: true });
    },

    /** The loop parked an action turn for AI seat `playerId`: decide and
        perform one action at a time, then end the turn to unpark the loop. */
    async takeTurn({ commit, dispatch }, playerId: number) {
      commit('setThinking', true);
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
        await performDecision(dispatch, playerId, d);
        await sleep(320);
      }
      commit('setThinking', false);
      await dispatch('game/endTurn', { playerId }, { root: true });
    },

    /** A trade offer is parked for AI seat `playerId`: judge it and answer
        with the shared `game/resolveOffer` action. */
    async considerOffer({ dispatch }, playerId: number) {
      const state = getGameState();
      const offer = state.pendingOffer;
      if (!offer || offer.toId !== playerId) {
        return;
      }
      const p = state.players[playerId];
      const proposer = state.players[offer.fromId];
      // pendingOffer is from the proposer's perspective; flip it to `p`'s.
      const accept = shouldAcceptTrade(p, offer.gets, offer.gives, proposer);
      await dispatch('game/resolveOffer', { playerId, accept }, { root: true });
    },
  },
};

/* ---------------------------------------------------------------------
   The listener. Watches the game module's parked-input flags and, when
   the parked seat is AI-controlled, dispatches the matching action. This
   is the AI's ONLY connection to the running game — the loop treats AI
   seats exactly like the human, raising the same flags and awaiting the
   same resolvers.
   --------------------------------------------------------------------- */
export function aiPlugin(store: Store<RootState>): void {
  const gs = () => store.state.game.state;

  // Draft pick parked for the active seat.
  store.watch(
    () => (gs().awaitingPick && !gs().over ? gs().activeId : -1),
    (seatId) => {
      if (isAiSeat(seatId)) {
        void store.dispatch('ai/pickCard', seatId);
      }
    },
  );

  // Action turn parked for the active seat.
  store.watch(
    () => (gs().awaitingAction && !gs().over ? gs().activeId : -1),
    (seatId) => {
      if (isAiSeat(seatId)) {
        void store.dispatch('ai/takeTurn', seatId);
      }
    },
  );

  // Trade offer parked for some seat.
  store.watch(
    () => gs().pendingOffer?.toId ?? -1,
    (toId) => {
      if (gs().pendingOffer && isAiSeat(toId)) {
        void store.dispatch('ai/considerOffer', toId);
      }
    },
  );
}
