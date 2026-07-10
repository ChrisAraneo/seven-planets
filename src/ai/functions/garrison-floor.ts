import { getTurn } from '@/game/getters/get-turn';

export function garrisonFloor(): number {
  return 2 + Math.min(8, Math.floor(getTurn() / 4));
}
