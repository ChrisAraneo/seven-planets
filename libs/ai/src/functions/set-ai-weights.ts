import { assign } from 'lodash-es';

import { getAiState } from '../state';
import type { Weights } from '../weights';

export const setAiWeights = (patch: Partial<Weights>): void =>
  void assign(getAiState(), {
    tuned: { ...getAiState().tuned, ...patch },
  });
