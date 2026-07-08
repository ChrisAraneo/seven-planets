import { sleep } from '@/game/effects';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { aiOneAction } from './ai-one-action';

export async function aiActionTurn(player: Player): Promise<void> {
  const state = getGameState();
  await sleep(350);

  for (let i = 0; i < 12; i++) {
    if (state.over) {
      return;
    }

    if (!(await aiOneAction(player))) {
      break;
    }

    await sleep(320);
  }
}
