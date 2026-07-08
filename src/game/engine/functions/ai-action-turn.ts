import { sleep } from '@/game/effects';
import type { GameState, Player } from '@/game/types';
import { aiOneAction } from './ai-one-action';

export async function aiActionTurn(
  state: GameState,
  player: Player,
): Promise<void> {
  await sleep(350);

  for (let i = 0; i < 12; i++) {
    if (state.over) {
      return;
    }

    if (!(await aiOneAction(state, player))) {
      break;
    }

    await sleep(320);
  }
}
