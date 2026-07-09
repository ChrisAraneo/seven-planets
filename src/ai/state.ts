import type { GameState } from '@/game/types';

import type { AiDifficulty } from './functions/ai-difficulty';
import type { Plan } from './functions/plan-types';
import { WEIGHTS, type Weights } from './weights';

/* =====================================================================
   Mastermind AI tuning state — the AI's PRIVATE memory.

   Deliberately a plain module singleton, not part of the game store:
   the AI observes the shared game state read-only and acts through the
   same store actions as the human; its own weights and plan cache are
   nobody else's business (and its hottest loops read them millions of
   times per simulated game, so no reactivity either).

   `tuned` holds the calibrated baseline weights; `W` is the ACTIVE set —
   activateWeightsFor() rebuilds it per player so difficulty handicaps
   apply to AI seats but never to the human proxy.
   ===================================================================== */

interface AiState {
  tuned: Weights;
  W: Weights;
  difficulty: AiDifficulty | null;
  randomPickChance: number;
  /** Per-state plan cache. Keyed weakly by the GameState object, so plans
      from finished simulation games vanish when their state is GC'd. */
  planCache: WeakMap<GameState, Map<number, Plan>>;
}

const aiState: AiState = {
  tuned: { ...WEIGHTS },
  W: { ...WEIGHTS },
  difficulty: null,
  randomPickChance: 0,
  planCache: new WeakMap(),
};

export function getAiState(): AiState {
  return aiState;
}
