import { getOver } from '@/stores/game/getters/get-over';
import { getTurn } from '@/stores/game/getters/get-turn';
import { getGameState } from '@/stores/game-state';

import { log } from '@/game/actions/common/log';
import { playTurn } from './play-turn';

export async function runGame(): Promise<void> {
  const state = getGameState();
  log('SEVEN PLANETS — seven worlds, one victor.', 'sys');
  log(
    'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
    'sys',
  );
  while (!getOver() && getTurn() < 400) {
    await playTurn();
  }
  state.activeId = -1;
}
