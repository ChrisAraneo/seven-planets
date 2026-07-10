import {
  getHumanResolve,
  setHumanResolve,
} from '../../functions/resolver-state';
import type { GameModuleState } from '../../game';
import { cloneDeep } from 'lodash-es';

export interface EndTurnPayload {
  playerId: number;
}

export async function endTurn(
  moduleState: GameModuleState,
  payload: EndTurnPayload,
): Promise<void> {
  const state = cloneDeep(moduleState.state);

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

  moduleState.state = state;
}
