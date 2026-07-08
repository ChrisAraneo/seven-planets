import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import type { AiDifficulty } from '@/game/ai/functions/ai-difficulty';
import type { Plan } from '@/game/ai/functions/plan-types';
import { WEIGHTS, type Weights } from '@/game/ai/weights';
import type { GameState } from '@/game/types';

/* =====================================================================
   Mastermind AI tuning state (formerly the ai-state.ts module singleton).

   `tuned` holds the calibrated baseline weights; `W` is the ACTIVE set —
   activateWeightsFor() rebuilds it per player so difficulty handicaps
   apply to AI seats but never to the human proxy.
   ===================================================================== */

export const useAiStore = defineStore('ai', () => {
  // ShallowRef: the weight objects are only ever swapped wholesale (see
  // Set-ai-weights / activate-weights-for) and are read in the AI's hottest
  // Loops — deep reactive proxies here would slow simulations several-fold.
  const tuned = shallowRef<Weights>({ ...WEIGHTS });
  const W = shallowRef<Weights>({ ...WEIGHTS });
  const difficulty = shallowRef<AiDifficulty | null>(null);
  const randomPickChance = ref(0);
  // Per-state plan cache. Keyed weakly by the GameState object, so plans from
  // Finished simulation games vanish when their state is garbage-collected.
  const planCache = shallowRef(new WeakMap<GameState, Map<number, Plan>>());

  return { tuned, W, difficulty, randomPickChance, planCache };
});

type AiStore = ReturnType<typeof useAiStore>;

// Cached accessor for the AI's hot loops — resolving the store through
// Pinia's useStore() on every call would dominate simulation CPU time.
// Assumes one Pinia per process / test module (see stores/game-state.ts).
let cachedStore: AiStore | undefined;

export function getAiStore(): AiStore {
  return (cachedStore ??= useAiStore());
}
