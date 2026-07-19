import type { BuildingType } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { ADVANCED_FROM_TURN, BUILD_ORDER } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { isSingularityLive } from './is-singularity-live';

export const computeCardAppearProbability = (
  buildingType: BuildingType,
  withinTurns: number,
): number =>
  chain(
    BUILD_ORDER.filter((candidate) =>
      match(candidate)
        .with('LAB', () => getTurn() >= ADVANCED_FROM_TURN)
        .with('SINGULARITY', () => isSingularityLive())
        .otherwise(() => true),
    ),
  )
    .thru((eligibleBuildings) =>
      match(eligibleBuildings.includes(buildingType))
        .with(false, () => 0.15)
        .otherwise(() =>
          chain(Math.min(1, 5 / eligibleBuildings.length))
            .thru((perTurn) => 1 - (1 - perTurn) ** Math.max(1, withinTurns))
            .value(),
        ),
    )
    .value();
