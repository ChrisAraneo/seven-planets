import { getTurn } from '@/stores/game/getters/get-turn';
import { ADVANCED_FROM_TURN, BUILD_ORDER } from '@/game/constants';
import type { BuildingType } from '@/game/types';

import { isSingularityLive } from './is-singularity-live';

export function cardAppearProb(id: BuildingType, withinTurns: number): number {
  const eligible = BUILD_ORDER.filter((b) =>
    b === 'LAB'
      ? getTurn() >= ADVANCED_FROM_TURN
      : b === 'SINGULARITY'
        ? isSingularityLive()
        : true,
  );
  if (!eligible.includes(id)) {
    return 0.15;
  }
  const per = Math.min(1, 5 / eligible.length);
  return 1 - (1 - per) ** Math.max(1, withinTurns);
}
