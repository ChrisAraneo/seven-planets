import { getOver } from '@/stores/game/getters/get-over';
import type { GameState } from '@/game/types';

import { agentActionTurn } from './agent-action-turn';
import { AUTO_HUMAN } from '@/stores/game/functions/auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';

export async function runActionPhase(state: GameState): Promise<void> {
  state.phase = 'action';
  for (const p of turnOrder(state)) {
    if (getOver()) {
      return;
    }
    if (!p.alive || p.skippedNow) {
      continue;
    }
    state.activeId = p.id;
    if (p.isHuman && !AUTO_HUMAN) {
      setStatus(
        state,
        'YOUR TURN — recruit, attack or trade. End turn when done.',
      );
      await humanActionTurn(state);
    } else {
      setStatus(state, `${p.name} is taking actions…`);
      await agentActionTurn(p);
    }
    if (getOver()) {
      return;
    }
  }
}
