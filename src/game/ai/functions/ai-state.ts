import type { Weights } from '../weights';
import { WEIGHTS } from '../weights';
import type { AiDifficulty } from './ai-difficulty';
import type { GameState, Player } from '@/game/types';
import type { Plan } from './plan-types';

export const aiState = {
  tuned: { ...WEIGHTS } as Weights,
  W: { ...WEIGHTS } as Weights,
  difficulty: null as AiDifficulty | null,
  randomPickChance: 0,
  planCache: new WeakMap<GameState, Map<number, Plan>>(),
};
