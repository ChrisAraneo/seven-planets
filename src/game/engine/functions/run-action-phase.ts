import type { GameState } from '@/game/types';
import { aiActionTurn } from './ai-action-turn';
import { AUTO_HUMAN } from './auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';

export async function runActionPhase(state: GameState): Promise<void> {
  state.phase = 'action';
  for (const p of turnOrder(state)) {
    if (state.over) {
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
      await aiActionTurn(state, p);
    }
    if (state.over) {
      return;
    }
  }
}
