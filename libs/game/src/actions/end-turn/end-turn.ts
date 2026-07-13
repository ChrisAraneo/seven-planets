import { dispatch } from '../../state';

export interface EndTurnPayload {
  playerId: number;
}

/** End the seat in play's action turn. Event creator: validation and
    application live in the reducer (applyEndTurn). */
export function endTurn(payload: EndTurnPayload): void {
  dispatch({ kind: 'endTurn', ...payload });
}
