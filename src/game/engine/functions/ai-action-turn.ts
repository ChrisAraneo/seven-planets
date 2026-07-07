import { sleep } from '@/game/effects';
import type { Player } from '@/game/types';
import { getState } from '../state';
import { aiOneAction } from './ai-one-action';

export async function aiActionTurn(p: Player): Promise<void> {
  await sleep(350);
  for (let i = 0; i < 12; i++) {
    if (getState().over) {
      return;
    }
    const did = await aiOneAction(p);
    if (!did) {
      break;
    }
    await sleep(320);
  }
}
