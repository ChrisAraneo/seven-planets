import { dispatch } from '../../state';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  troops: number;
}

/** Redeploy troops. Event creator: validation and resolution live in the
    reducer (applyMoveTroops). */
export function moveTroops(payload: MoveTroopsPayload): void {
  dispatch({ kind: 'move', payload });
}
