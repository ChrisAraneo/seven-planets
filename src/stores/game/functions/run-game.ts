import { getOver } from '@/stores/game/getters/get-over';
import { getTurn } from '@/stores/game/getters/get-turn';
import type { GameState } from '@/game/types';

import { log } from './log';
import { playTurn } from './play-turn';

export async function runGame(state: GameState): Promise<void> {
  log(state, 'SEVEN PLANETS — seven worlds, one victor.', 'sys');
  log(
    state,
    'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
    'sys',
  );
  while (!getOver() && getTurn() < 400) {
    await playTurn(state);
  }
  state.activeId = -1;
}
