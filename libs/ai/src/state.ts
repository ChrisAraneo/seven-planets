import type { GameState } from '@seven-planets/game';

import type { AiDifficulty } from './functions/ai-difficulty';
import type { Plan } from './functions/plan-types';
import { WEIGHTS, type Weights } from './weights';

interface AiState {
  tuned: Weights;
  W: Weights;
  difficulty: AiDifficulty | null;
  randomPickChance: number;
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
