import { computed, reactive } from 'vue';

import type { Difficulty } from '@/game/difficulty';
import type { Cost, InfluenceOpts, InfluenceType } from '@/game/types';

import { store } from './index';
import type { ModalName } from './modules/ui';

export type { ModalName } from './modules/ui';

/* =====================================================================
   UI-facing composable over the Vuex store. Components read reactive
   state through it and act by dispatching the game module's PLAYER
   ACTIONS — the exact same actions the AI agent dispatches. Every
   dispatch carries the human's seat id, which the actions validate
   against the seat in play.
   ===================================================================== */

// The human always sits at seat 0 (see engine/state.ts).
const HUMAN_SEAT = 0;

const gameStore = reactive({
  /* ---------------- reactive state ---------------- */

  state: computed(() => store.state.game.state),
  modal: computed((): ModalName => store.state.ui.modal),
  fastMode: computed(() => store.state.effects.fastMode),
  difficulty: computed(() => store.state.ui.difficulty),

  /* ---------------- derived ---------------- */

  human: computed(() => store.state.game.state.players[HUMAN_SEAT]),
  isHumanTurn: computed(() => {
    const s = store.state.game.state;
    return s.awaitingAction && !s.busy && !s.over;
  }),
  // AwaitingPick is now raised for EVERY drafting seat, so scope the human's
  // Pool highlighting (and clicks) to the human's own draft turns.
  isPicking: computed(() => {
    const s = store.state.game.state;
    return s.awaitingPick && s.activeId === HUMAN_SEAT && !s.over;
  }),

  /* ---------------- lifecycle ---------------- */

  start(): void {
    void store.dispatch('ui/start');
  },
  chooseDifficulty(level: Difficulty): void {
    void store.dispatch('ui/chooseDifficulty', level);
  },
  newGame(): void {
    void store.dispatch('ui/newGame');
  },
  setFast(v: boolean): void {
    store.commit('effects/setFastMode', v);
  },

  /* ---------------- modal control ---------------- */

  openModal(name: ModalName): void {
    store.commit('ui/openModal', name);
  },
  closeModal(): void {
    store.commit('ui/closeModal');
  },

  /* ------- human interactions (the shared player actions) ------- */

  pickCard(idx: number): void {
    void store.dispatch('game/pick', { playerId: HUMAN_SEAT, idx });
  },

  endTurn(): void {
    void store.dispatch('game/endTurn', { playerId: HUMAN_SEAT });
  },

  recruit(planetId: number): void {
    store.commit('ui/closeModal');
    void store.dispatch('game/recruit', { playerId: HUMAN_SEAT, planetId });
  },

  async attack(sourceId: number, targetId: number, n: number): Promise<void> {
    store.commit('ui/closeModal');
    await store.dispatch('game/attack', {
      playerId: HUMAN_SEAT,
      sourceId,
      targetId,
      n,
    });
  },

  async move(fromId: number, toId: number, n: number): Promise<void> {
    store.commit('ui/closeModal');
    await store.dispatch('game/move', {
      playerId: HUMAN_SEAT,
      fromId,
      toId,
      n,
    });
  },

  /** Propose a human-initiated trade. Resolves with the partner's answer. */
  proposeTrade(partnerId: number, gives: Cost, gets: Cost): Promise<boolean> {
    return store.dispatch('game/trade', {
      playerId: HUMAN_SEAT,
      partnerId,
      gives,
      gets,
    });
  },

  playInfluence(type: InfluenceType, opts: InfluenceOpts = {}): void {
    store.commit('ui/closeModal');
    void store.dispatch('game/scheme', { playerId: HUMAN_SEAT, type, opts });
  },

  resolveOffer(accept: boolean): void {
    void store.dispatch('game/resolveOffer', {
      playerId: HUMAN_SEAT,
      accept,
    });
  },
});

export function useGameStore(): typeof gameStore {
  return gameStore;
}
