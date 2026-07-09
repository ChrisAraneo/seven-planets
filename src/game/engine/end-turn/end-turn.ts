import { getHumanResolve, setHumanResolve } from '../common/resolver-state';
import type { GameState } from '@/game/types';

export interface EndTurnPayload {
  playerId: number;
}

export async function endTurn(
  state: GameState,
  payload: EndTurnPayload,
): Promise<GameState> {
  if (payload.playerId !== state.activeId) {
    return state;
  }

  const humanResolve = getHumanResolve();

  if (!humanResolve) {
    return state;
  }

  setHumanResolve(null);

  state.awaitingAction = false;

  humanResolve();

  return state;
}
