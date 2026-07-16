import { getTurn } from '@seven-planets/game';

export function computeGarrisonFloor(): number {
  return 2 + Math.min(8, Math.floor(getTurn() / 4));
}
