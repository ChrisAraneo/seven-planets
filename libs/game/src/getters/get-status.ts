import { getGameStateLastValue } from '../state';

export function getStatus(): string {
  return getGameStateLastValue().status;
}
