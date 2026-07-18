import type { Player } from '@seven-planets/game';
import { partition } from 'lodash-es';
import { match } from 'ts-pattern';

import type { BuildCandidate } from './get-build-candidates';
import { hasBuilding } from './has-building';
import type { StrategyKind } from './plan-types';

export const prioritizeEnablers = (
  queue: BuildCandidate[],
  kind: StrategyKind,
  player: Player,
): BuildCandidate[] =>
  match(kind)
    .with('MILITARIZE', 'STRIKE', () =>
      partition(
        queue,
        (candidate) =>
          (candidate.id === 'BARRACKS' && !hasBuilding(player, 'BARRACKS')) ||
          (candidate.id === 'SILO' && !hasBuilding(player, 'SILO')),
      ).flat(),
    )
    .with('FORTIFY', () =>
      partition(
        queue,
        (candidate) =>
          (candidate.id === 'BARRACKS' && !hasBuilding(player, 'BARRACKS')) ||
          candidate.id === 'SHIELD',
      ).flat(),
    )
    .otherwise(() => queue);
