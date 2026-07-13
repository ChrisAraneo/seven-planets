import { getGameStateLastValue } from '../state';

export function getIsOver(): boolean {
  return !!getGameStateLastValue().over?.winner;
}
