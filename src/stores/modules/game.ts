import { markRaw } from 'vue';
import type { Module } from 'vuex';

import { attack } from '@/game/actions/attack';
import { endTurn } from '@/game/actions/end-turn';
import { move } from '@/game/actions/move';
import { pick } from '@/game/actions/pick';
import { recruit } from '@/game/actions/recruit';
import { scheme } from '@/game/actions/scheme';
import { resolveOffer, trade } from '@/game/actions/trade';
import { resetResolvers } from '@/game/engine/functions/resolver-state';
import { buildState } from '@/game/engine/state';
import type { GameState } from '@/game/types';

import type { RootState } from '../index';

/* =====================================================================
   The game module: single source of truth for the live game state, plus
   the PLAYER ACTIONS — the only ways to act on a game. The human UI and
   the AI agent dispatch exactly the same actions; each action validates
   that the dispatching seat (payload.playerId) is the seat in play, so
   a stray human click can never act for an AI seat (or vice versa).

   The engine's internal rules mutate the state object directly (the
   store runs with Vuex strict mode off by design — see ../index.ts);
   these actions are the shared entry points that invoke those rules.
   ===================================================================== */

export interface GameModuleState {
  state: GameState;
}

export const game: Module<GameModuleState, RootState> = {
  namespaced: true,

  state: () => ({ state: buildState() }),

  mutations: {
    /** Fresh game state. `raw` (headless simulations) skips reactivity. */
    reset(ms, opts: { raw?: boolean } = {}) {
      ms.state = opts.raw ? markRaw(buildState()) : buildState();
      resetResolvers();
    },
  },

  actions: {
    /** Draft: take pool card `idx` for the seat in play. */
    pick(_ctx, payload: Parameters<typeof pick>[0]) {
      return pick(payload);
    },
    /** Action turn: launch an attack. Resolves after the battle. */
    attack(_ctx, payload: Parameters<typeof attack>[0]) {
      return attack(payload);
    },
    /** Action turn: redeploy troops between own planets. */
    move(_ctx, payload: Parameters<typeof move>[0]) {
      return move(payload);
    },
    /** Action turn: raise troops on an owned planet. */
    recruit(_ctx, payload: Parameters<typeof recruit>[0]) {
      return recruit(payload);
    },
    /** Action turn: propose a trade. Resolves with the partner's answer. */
    trade(_ctx, payload: Parameters<typeof trade>[0]) {
      return trade(payload);
    },
    /** Action turn: play a held influence card. */
    scheme(_ctx, payload: Parameters<typeof scheme>[0]) {
      return scheme(payload);
    },
    /** Answer the pending trade offer addressed to this seat. */
    resolveOffer(_ctx, payload: Parameters<typeof resolveOffer>[0]) {
      return resolveOffer(payload);
    },
    /** End the human's action turn. */
    endTurn(_ctx, payload: Parameters<typeof endTurn>[0]) {
      return endTurn(payload);
    },
  },
};
