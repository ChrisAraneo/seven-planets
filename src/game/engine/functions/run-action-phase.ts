import { getOver } from '@/stores/game/getters/get-over';
import { getGameState } from '@/stores/game-state';

import { agentActionTurn } from './agent-action-turn';
import { AUTO_HUMAN } from '@/game/actions/common/auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from '@/game/actions/common/set-status';
import { turnOrder } from './turn-order';

export async function runActionPhase(): Promise<void> {
  const state = getGameState();
  state.phase = 'action';
  for (const p of turnOrder()) {
    if (getOver()) {
      return;
    }
    if (!p.alive || p.skippedNow) {
      continue;
    }
    state.activeId = p.id;
    if (p.isHuman && !AUTO_HUMAN) {
      setStatus('YOUR TURN — recruit, attack or trade. End turn when done.');
      await humanActionTurn();
    } else {
      setStatus(`${p.name} is taking actions…`);
      await agentActionTurn(p);
    }
    if (getOver()) {
      return;
    }
  }
}
