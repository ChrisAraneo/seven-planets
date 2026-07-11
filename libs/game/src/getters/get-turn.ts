import { getGameState } from '../game-state';

export function getTurn(): number {
  return getGameState().turn;
}
