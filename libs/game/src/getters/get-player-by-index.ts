import type { Player } from '../interfaces/player';
import { getGameStateLastValue } from '../state';

export function getPlayerByIndex(index: number): Player | undefined {
  return getGameStateLastValue().players?.[index] ?? undefined;
}
