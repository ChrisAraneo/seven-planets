import type { InfluenceType } from '../interfaces/influence-type';
import type { InfluenceOpts } from '../interfaces/influence-opts';

export interface UseInfluenceAction {
  kind: 'USE_INFLUENCE';
  payload: UseInfluencePayload;
}

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}

export const createUseInfluenceAction = (
  payload: UseInfluencePayload,
): UseInfluenceAction => ({
  kind: 'USE_INFLUENCE',
  payload,
});
