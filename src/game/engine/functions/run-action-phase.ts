import { getState } from '../state';
import { aiActionTurn } from './ai-action-turn';
import { AUTO_HUMAN } from './auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';

export async function runActionPhase(): Promise<void> {
  getState().phase = 'action';
  for (const p of turnOrder()) {
    if (getState().over) {
      return;
    }
    if (!p.alive || p.skippedNow) {
      continue;
    }
    getState().activeId = p.id;
    if (p.isHuman && !AUTO_HUMAN) {
      setStatus('YOUR TURN — recruit, attack or trade. End turn when done.');
      await humanActionTurn();
    } else {
      setStatus(`${p.name} is taking actions…`);
      await aiActionTurn(p);
    }
    if (getState().over) {
      return;
    }
  }
}
