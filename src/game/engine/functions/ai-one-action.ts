import type { Player } from '@/game/types';
import { mastermindOneAction } from './mastermind-one-action';

export async function aiOneAction(p: Player): Promise<boolean> {
  return mastermindOneAction(p);
}
