import type { InfluenceType } from '../interfaces/influence-type';
import type { InfluenceOptions } from '../interfaces/influence-options';

export interface UseInfluenceAction {
  kind: 'USE_INFLUENCE';
  payload: UseInfluencePayload;
}

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  options?: InfluenceOptions;
}

export const createUseInfluenceAction = (
  payload: UseInfluencePayload,
): UseInfluenceAction => ({
  kind: 'USE_INFLUENCE',
  payload,
});
