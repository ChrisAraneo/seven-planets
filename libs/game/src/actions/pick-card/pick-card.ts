import { dispatch } from '../../state';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

/** Answer a parked draft pick with the chosen pool index. Event creator:
    validation and application live in the reducer (applyPickCard). */
export function pickCard(payload: PickCardPayload): void {
  dispatch({ kind: 'pick', ...payload });
}
