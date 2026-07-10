import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState } from '../game-state';

import { log } from './log';
import { playTurn } from './play-turn';

export async function runGame(): Promise<void> {
  log(getGameState(), 'SEVEN PLANETS — seven worlds, one victor.', 'sys');
  log(
    getGameState(),
    'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
    'sys',
  );
  while (!getOver() && getTurn() < 400) {
    await playTurn();
  }
  getGameState().activeId = -1;
}
