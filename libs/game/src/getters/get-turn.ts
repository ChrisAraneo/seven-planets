import { getGameState } from '../state';

export function getTurn(): number {
  return getGameState().turn;
}
