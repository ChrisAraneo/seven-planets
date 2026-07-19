import { assign } from 'lodash-es';

import { CARDS, INFLUENCE_CARDS } from '../../../config/constants';
import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';
import type { InfluenceType } from '../../../interfaces/influence-type';

export const logPlay = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  cssClass: string,
): void =>
  void assign(
    state,
    log(
      state,
      `⭐ ${state.players[playerId].name} plays ${CARDS[influenceType].icon} ${INFLUENCE_CARDS[influenceType].name}`,
      cssClass,
    ),
  );
