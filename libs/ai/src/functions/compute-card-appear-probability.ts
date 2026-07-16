import { getTurn } from '@seven-planets/game';
import { ADVANCED_FROM_TURN, BUILD_ORDER } from '@seven-planets/game';
import type { BuildingType } from '@seven-planets/game';

import { isSingularityLive } from './is-singularity-live';

export function computeCardAppearProbability(
  buildingType: BuildingType,
  withinTurns: number,
): number {
  const eligibleBuildings = BUILD_ORDER.filter((candidate) =>
    candidate === 'LAB'
      ? getTurn() >= ADVANCED_FROM_TURN
      : candidate === 'SINGULARITY'
        ? isSingularityLive()
        : true,
  );
  if (!eligibleBuildings.includes(buildingType)) {
    return 0.15;
  }
  const perTurn = Math.min(1, 5 / eligibleBuildings.length);
  return 1 - (1 - perTurn) ** Math.max(1, withinTurns);
}
