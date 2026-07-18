import { getTurn } from '@seven-planets/game';
import { sumBy } from 'lodash-es';

import type { BuildCandidate } from './get-build-candidates';

export const computeDevelopScore = (queue: BuildCandidate[]): number =>
  sumBy(
    queue.slice(0, 3),
    (candidate) => candidate.worth * candidate.pComplete,
  ) *
  0.45 *
  Math.max(0.45, 1.15 - getTurn() / 90);
