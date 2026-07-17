import { dispatch } from '../../state';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  troops: number;
}

export function moveTroops(payload: MoveTroopsPayload): void {
  dispatch({ kind: 'MOVE_TROOPS', payload });
}
