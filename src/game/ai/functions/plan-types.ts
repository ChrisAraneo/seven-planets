import type { BuildingType } from '@/game/types';
import type { AttackPlan } from './evaluate-attacks';
import type { BuildCandidate } from './build-candidates';

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
