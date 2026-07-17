import { assign } from 'lodash-es';

import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';

export const spendInfluenceCard = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
): void =>
  void assign(state.players[playerId].hand, {
    [influenceType]: state.players[playerId].hand[influenceType] - 1,
  });
