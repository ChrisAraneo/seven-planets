import { getGameStateLastValue } from '../state';

export function getIsOver(): boolean {
  return Boolean(getGameStateLastValue().over?.winner);
}
