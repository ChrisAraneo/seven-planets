import type { BuildingType } from '@seven-planets/game';

import type { BuildCandidate } from './build-candidates';
import type { AttackPlan } from './evaluate-attacks';

export type StrategyKind =
  | 'DEVELOP'
  | 'MILITARIZE'
  | 'STRIKE'
  | 'FORTIFY'
  | 'COUP_BANK';

export interface Plan {
  kind: StrategyKind;
  computedTurn: number;
  buildQueue: BuildCandidate[];
  strike: AttackPlan | null;
  targetId: number | null;
  stagingId: number | null;
  troopsNeeded: number;
  threat: number;
  scores: Record<StrategyKind, number>;
}
