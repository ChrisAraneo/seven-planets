import type { GameState, Player } from '@/game/types';
import { mastermindOneAction } from './mastermind-one-action';

export async function aiOneAction(
  state: GameState,
  player: Player,
): Promise<boolean> {
  return mastermindOneAction(state, player);
}
