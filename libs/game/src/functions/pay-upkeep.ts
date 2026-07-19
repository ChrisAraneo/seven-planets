import { SHIELD_UPKEEP_CRYSTAL } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import { updatePlayer } from './update-player';

export const payUpkeep = (state: GameState, ownerId: number): GameState =>
  updatePlayer(state, ownerId, (player) => ({
    ...player,
    hand: {
      ...player.hand,
      CRYSTAL: (player.hand.CRYSTAL || 0) - SHIELD_UPKEEP_CRYSTAL,
    },
  }));
