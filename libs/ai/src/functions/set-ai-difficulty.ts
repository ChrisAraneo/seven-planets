import { assign } from 'lodash-es';

import { getAiState } from '../state';
import type { AiDifficulty } from './ai-difficulty';

export const setAiDifficulty = (aiDifficulty: AiDifficulty): void =>
  void assign(getAiState(), { difficulty: aiDifficulty });

export { type AiDifficulty } from './ai-difficulty';
