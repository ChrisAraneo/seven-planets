import { ADVANCED_FROM_TURN, BUILD_ORDER } from '@/game/constants';
import type { BuildingType, GameState } from '@/game/types';
import { singularityLive } from './singularity-live';

export function cardAppearProb(
  s: GameState,
  id: BuildingType,
  withinTurns: number,
): number {
  const eligible = BUILD_ORDER.filter((b) =>
    b === 'LAB'
      ? s.turn >= ADVANCED_FROM_TURN
      : b === 'SINGULARITY'
        ? singularityLive(s)
        : true,
  );
  if (!eligible.includes(id)) {
    return 0.15;
  }
  const per = Math.min(1, 5 / eligible.length);
  return 1 - (1 - per) ** Math.max(1, withinTurns);
}
