import { dispatch } from '../../state';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { InfluenceOpts } from '../../interfaces/influence-opts';

export interface UseInfluencePayload {
  playerId: number;
  type: InfluenceType;
  opts?: InfluenceOpts;
}

/** Play a held influence card. Event creator: validation and resolution
    live in the reducer (applyUseInfluence). */
export function useInfluence(payload: UseInfluencePayload): void {
  dispatch({ kind: 'influence', payload });
}
