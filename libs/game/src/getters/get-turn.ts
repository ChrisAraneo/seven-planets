import { getGameStateLastValue } from '../state';

export function getTurn(): number {
  return getGameStateLastValue().turn;
}
