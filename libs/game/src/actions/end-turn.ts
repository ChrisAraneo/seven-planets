import { getHumanResolve, setHumanResolve } from '../functions/resolver-state';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';

export interface EndTurnPayload {
  playerId: number;
}

export function endTurn(payload: EndTurnPayload): void {
  const state = cloneDeep(getGameState());

  if (payload.playerId !== state.activeId) {
    return;
  }

  const humanResolve = getHumanResolve();

  if (!humanResolve) {
    return;
  }

  setHumanResolve(null);

  state.awaitingAction = false;

  humanResolve();

  setGameState(state);
}
