import { assign } from 'lodash-es';

import { getAiState } from '../state';
import { WEIGHTS } from '../weights';

export const resetAiWeights = (): void =>
  void assign(getAiState(), {
    tuned: { ...WEIGHTS },
    W: { ...WEIGHTS },
    difficulty: null,
    randomPickChance: 0,
  });
