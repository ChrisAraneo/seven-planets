import { assign } from 'lodash-es';

import { CARDS, INFLUENCE_CARDS } from '../../config/constants';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';

export const applyInfluencePick = (
  state: GameState,
  player: Player,
  influenceType: InfluenceType,
): void =>
  void chain(
    assign(player, {
      influence: player.influence - INFLUENCE_CARDS[influenceType].cost,
      hand: { ...player.hand, [influenceType]: player.hand[influenceType] + 1 },
    }),
  )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `⭐ ${player.name} drafts ${CARDS[influenceType].icon} ${CARDS[influenceType].name} (−${INFLUENCE_CARDS[influenceType].cost}⭐) — holds it for a later action turn`,
          'draft',
        ),
      ),
    )
    .value();
