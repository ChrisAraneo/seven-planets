import { getTurn } from '@seven-planets/game';
import { ADVANCED_FROM_TURN, BUILD_ORDER } from '@seven-planets/game';
import type { BuildingType } from '@seven-planets/game';

import { isSingularityLive } from './is-singularity-live';

export function cardAppearProb(id: BuildingType, withinTurns: number): number {
  const eligible = BUILD_ORDER.filter((buildingType) =>
    buildingType === 'LAB'
      ? getTurn() >= ADVANCED_FROM_TURN
      : buildingType === 'SINGULARITY'
        ? isSingularityLive()
        : true,
  );
  if (!eligible.includes(id)) {
    return 0.15;
  }
  const per = Math.min(1, 5 / eligible.length);
  return 1 - (1 - per) ** Math.max(1, withinTurns);
}
