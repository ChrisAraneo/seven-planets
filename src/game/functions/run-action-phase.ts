import { getOver } from '@/game/getters/get-over';
import { getGameState } from '@/stores/game-state';

import { AUTO_HUMAN } from '@/game/functions/auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';

/* Every seat's action turn is handled identically: raise `awaitingAction`
   and park. The human answers by ending their turn from the UI; an AI seat
   is answered by the `ai` store module, which watches the same flag, plays
   its actions and dispatches `endTurn` to unpark us. */
export async function runActionPhase(): Promise<void> {
  getGameState().phase = 'action';
  const order = turnOrder(getGameState()).map((p) => p.id);
  for (const seatId of order) {
    if (getOver()) {
      return;
    }
    const p = getGameState().players[seatId];
    if (!p.alive || p.skippedNow) {
      continue;
    }
    getGameState().activeId = seatId;
    setStatus(
      getGameState(),
      p.isHuman && !AUTO_HUMAN
        ? 'YOUR TURN — recruit, attack or trade. End turn when done.'
        : `${p.name} is taking actions…`,
    );
    await humanActionTurn(getGameState());
    if (getOver()) {
      return;
    }
  }
}
