import { getState } from '../state';
import { log } from './log';
import { playTurn } from './play-turn';

export async function runGame(): Promise<void> {
  log('SEVEN PLANETS — seven worlds, one victor.', 'sys');
  log(
    'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
    'sys',
  );
  while (!getState().over && getState().turn < 400) {
    await playTurn();
  }
  getState().activeId = -1;
}
