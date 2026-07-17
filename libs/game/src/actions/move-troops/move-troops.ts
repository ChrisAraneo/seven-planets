import { dispatch } from '../../dispatch';

export interface MoveTroopsPayload {
  playerId: number;
  fromId: number;
  toId: number;
  troops: number;
}

export const moveTroops = (payload: MoveTroopsPayload): void => {
  dispatch({ kind: 'MOVE_TROOPS', payload });
};
