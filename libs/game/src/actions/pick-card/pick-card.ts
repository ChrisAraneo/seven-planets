import { dispatch } from '../../state';

export interface PickCardPayload {
  playerId: number;
  index: number;
}

export function pickCard(payload: PickCardPayload): void {
  dispatch({ kind: 'PICK_CARD', ...payload });
}
