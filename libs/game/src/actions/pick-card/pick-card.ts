import { dispatch } from '../../dispatch';

export interface PickCardPayload {
  playerId: number;
  index: number;
}

export const pickCard = (payload: PickCardPayload): void => {
  dispatch({ kind: 'PICK_CARD', ...payload });
};
