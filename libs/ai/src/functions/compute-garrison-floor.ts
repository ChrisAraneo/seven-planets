import { getTurn } from '@seven-planets/game';

export const computeGarrisonFloor = (): number =>
  2 + Math.min(8, Math.floor(getTurn() / 4));
