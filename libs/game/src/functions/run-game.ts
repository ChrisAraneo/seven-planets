import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState } from '../game-state';

import { log } from './log';
import { playTurn } from './play-turn';

export async function runGame(): Promise<void> {
  Object.assign(
    getGameState(),
    log(getGameState(), 'SEVEN PLANETS — seven worlds, one victor.', 'sys'),
  );
  Object.assign(
    getGameState(),
    log(
      getGameState(),
      'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
      'sys',
    ),
  );
  while (!getOver() && getTurn() < 400) {
    await playTurn();
  }
  getGameState().activeId = -1;
}
