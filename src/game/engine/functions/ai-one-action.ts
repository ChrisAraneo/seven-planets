import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { mastermindOneAction } from './mastermind-one-action';

export async function aiOneAction(player: Player): Promise<boolean> {
  const state = getGameState();
  return mastermindOneAction(player);
}
